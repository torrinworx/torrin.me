import { StageContext, Typography, Button, Icon, Shown, ValidateContext, Validate, TextField, TextArea, Observer, ThemeContext } from 'destamatic-ui';

import Email from '../utils/Email.jsx';
import useShine from '../utils/Shine.jsx'

const deliverables = [
	{
		bold: 'Professional online presence',
		text: 'A clean, modern, accessible website that makes your business look credible and up to date.',
	},
	{
		bold: 'Clear info about your business',
		text: 'Simple pages that explain who you are, what you offer, where you are, and how to reach you.',
	},
	{
		bold: 'Easy contact and quotes',
		text: 'A contact/quote form that sends leads straight to your inbox so customers don\'t get lost in DMs.',
	},
	{
		bold: 'Works on phones and computers',
		text: 'Mobile-friendly, fast, and easy to read so customers can use it anywhere.',
	},
	{
		bold: 'Managed hosting and security',
		text: 'I host the site for you, keep it secure with SSL, and handle domains and DNS.',
	},
	{
		bold: 'Simple stats and lead log',
		text: 'A small page where you can see how many people visit and who has contacted you.',
	},
	{
		bold: 'One person to call',
		text: 'If something breaks or you want a change, you email or call me and I take care of it.',
	},
];

const process = [
	{
		bold: 'Assessment',
		text: 'You contact me via the form on this page or my email address, I will schedule you in for a 30 minute meeting to assess your needs.'
	},
	{
		bold: 'Contract',
		text: 'Based on the assessment, I will draft a contract and statement of work that will outline the project details, deliverables, timelines, cost and requirements.'
	},
	{
		bold: 'Agreement',
		text: 'I will send you the documents to review. I will mend them if you require modifications. Once signed, I will begin building your website.'
	},
	{
		bold: 'Design',
		text: 'We\'ll have a 1-hour meeting to review your current site (if you have one), discuss improvements, and decide what pages and content you want. You provide branding assets (logo, fonts, colors, photos, copy) where available.',
	},
	{
		bold: 'Implement',
		text: 'I design and build the site for you, using your branding and content, I will make layout and design decisions based on what I believe will work best for your business. You don\'t need to worry about the details.',
	},
	{
		bold: 'Revisions',
		text: 'I will send you a link to a draft of your website, you will review it and send me a list of revisions, I will implement them accordingly. This will occur twice to ensure the finished product is to your liking.',
	},
	{
		bold: 'Deploy',
		text: 'I will deploy your website. This includes DNS record access and management, SSL certificates, hosting, statistics tracking, and other odds and ends.',
	},
	{
		bold: 'Ongoing',
		text: "After deployment I will continue to maintain and revise your site. You will have continuous access to the statistics and lead dashboard to view your site\'s performance live."
	},
	{
		bold: 'More',
		text: 'If you need larger changes after deployment, such as new pages, new features, or a bigger redesign, we can scope that work separately and agree on a fair additional fee.',
	},
];

const prerequisites = [
	{
		bold: 'Iconography & Branding',
		text: 'I expect assets for your businesses logos, iconography, and branding to be provided to me in the design phase. I will help you create web themes based on these assets, but I am not in the business of logo and brand design.'
	},
	{
		bold: 'Email',
		text: 'I expect you to already have an email setup for your business. (The email you want customers to reach you with)'
	},
	{
		bold: 'DNS Records Access',
		text: 'If you already have a domain and want to own it yourself, I will need access to your domains DNS records in order to deploy your website.'
	},
];

const pricing = [
	{
		bold: 'Setup',
		text: <>A setup fee of <b>$150 CAD</b> for the work needed to design, implement, and deploy your website.</>,
	},
	{
		bold: 'Maintenance',
		text: <>Recurring fee of <b>$20/month CAD</b> that will cover hosting your website, hosting your stats / lead dashboard, and 5 monthly revisions to keep your website up to date.</>
	},
	{
		bold: 'Photography (optional)',
		text: <>Hourly fee of <b>$25/hour CAD</b> where I will photograph your business, employees, services, and products to feature on your website. (Must be located within Waterloo Region)</>
	},
	{
		bold: 'Additional pages (optional)',
		text: <>If you need more than the standard set of pages, extra pages can be added for <b>$50 CAD per page</b>. This includes page design, implementation, and deployment to your existing site.</>,
	},
];

const hero = [
	<>Available for <b>local shops and contractors.</b></>,
	<><b>I take full ownership of your website</b> so you don't have to think about design, hosting, tech, and lead tracking. <b>I handle it all for you.</b></>,
	<>I'll build you a <b>modern, accessible, and fully customized</b> website for your business.</>,
	<>You get <b>one person to call when something breaks</b>, a simple link that just works, and a clear form where customers can contact you.</>,
];

const ListItem = ({ each, arr }) => <li key={arr.indexOf(each)}>
	<Shown value={each.bold}>
		<Typography type='body_bold' label={each.bold + ': '} />
	</Shown>
	<Typography type='body' label={each.text ? each.text : each} />
</li>;

const Services = ThemeContext.use(h => StageContext.use(s => ({ }, cleanup, mounted) => {
	const submitted = Observer.mutable(false);
	const contactRef = Observer.mutable(null);
	const focused = Observer.mutable(false);

	const [shines, createShine] = useShine();
	cleanup(Observer.timer(2000).watch(t => t.value % 2 === 0 && createShine()));
	mounted(() => createShine());

	const sendContactForm = async (data) => {
		const res = await fetch('/contact', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});

		const json = await res.json();
		if (!res.ok || !json.ok) {
			throw new Error(json.error || 'Failed to send message');
		}

		return json;
	};

	const FormThing = () => {
		const fullName = Observer.mutable('');
		const email = Observer.mutable('');
		const phone = Observer.mutable('');
		const message = Observer.mutable('');
		const submit = Observer.mutable(false);
		const allValid = Observer.mutable(true);

		return <div theme='column_center_fill' style={{ gap: 10 }}>
			<ValidateContext value={allValid}>
				<div theme="column_center_fill" style={{ gap: 10, maxWidth: 400 }}>
					<TextField placeholder="Full Name*" value={fullName} type='outlined_fill' />
					<Validate
						value={fullName}
						validate={val => {
							const v = val.get() || '';
							if (!v.trim()) return 'This field is required.';
							if (/\d/.test(v)) return 'This field cannot contain numbers.';
							return '';
						}}
						signal={submit}
					/>

					<TextField placeholder="Email*" value={email} type='outlined_fill' />
					<Validate
						value={email}
						validate={value => {
							let val = value.get() || '';
							val = val.trim();

							// required check first
							if (!val) {
								value.set('');
								return 'Email address is required.';
							}

							const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

							value.set(val);

							if (!emailRegex.test(val)) {
								return 'Please enter a valid email address.';
							}
							return '';
						}}
						signal={submit}
					/>

					<TextField placeholder="Phone Number*" value={phone} type='outlined_fill' />
					<Validate
						value={phone}
						validate={value => {
							let val = value.get() || '';
							const digits = val.replace(/\D/g, '');

							// required check first
							if (!digits) {
								value.set(''); // clear any junk input
								return 'Phone number is required.';
							}

							let formatted = digits;
							if (digits.length > 3) {
								formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}`;
							}
							if (digits.length > 6) {
								formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
							}

							value.set(formatted);

							if (digits.length < 10) {
								return 'Please enter a valid 10-digit phone number.';
							}
							return '';
						}}
						signal={submit}
					/>

					<TextArea placeholder='Message*' value={message} type='outlined_fill' />
					<Validate
						value={message}
						validate={val => {
							const v = val.get() || '';
							if (!v.trim()) return 'This field is required.';
							if (/\d/.test(v)) return 'This field cannot contain numbers.';
							return '';
						}}
						signal={submit}
					/>
				</div>
				<Typography />
				<Button
					type="contained"
					label="Submit"
					onClick={async () => {
						submit.set({ value: true });

						if (allValid.get()) {
							await sendContactForm({
								fullName: fullName.get(),
								email: email.get(),
								phone: phone.get(),
								message: message.get(),
							});
							submitted.set(true)
						}
					}}
				/>
			</ValidateContext>
		</div>;
	};

	return <>
		<div theme="column_center_fill_start" style={{ gap: 10 }}>
			<div>
				<Typography
					type="h1"
					label="Torrin's Services"
				/>
				<Typography
					type='p1_bold'
					label='I build and maintain websites for small businesses.'
				/>
				<div theme="divider" />
				<Typography
					type="body"
				>
					I'm a full-stack software engineer with {new Date().getFullYear() - 2017} years of professional experience. <b>Based in Waterloo, Ontario 🇨🇦.</b><br />
				</Typography>

				<ul style={{ paddingLeft: 25 }}>
					<ListItem each={hero} arr={hero} />
				</ul>
			</div>

			<div theme="row_wrap_fill_start" style={{ marginTop: 10, gap: 10 }}>
				<Button
					title="Get in touch about a new or updated website."
					label="Request a website"
					type="contained"
					icon={<Icon name="feather:mail" />}
					iconPosition="right"
					onClick={() => {
						if (contactRef.get()) {
							contactRef.get().scrollIntoView({ behavior: 'smooth', block: 'start' });
							focused.set(true);
						}
					}}
				>
					{shines}
				</Button>
				<Email />
				<Button
					title="View my portfolio and past work."
					label="View my work"
					type="outlined"
					icon={<Icon name="feather:external-link" />}
					iconPosition="right"
					onClick={() => s.open({ name: 'landing' })}
					href="/"
				/>
			</div>
		</div>

		<div theme='column_center_fill' style={{ gap: 10 }}>
			<Typography theme='row_fill_start' type='h2' label='Deliverables' />
			<div theme='divider' />
			<Typography
				type='p1'
				theme='row_fill_start'
				label='What I will deliver to you when you hire me.'
			/>
			<ul style={{ paddingLeft: 25 }}>
				<ListItem each={deliverables} arr={deliverables} />
			</ul>
		</div>

		<div theme='column_center_fill' style={{ gap: 10 }}>
			<Typography theme='row_fill_start' type='h2' label='Process' />
			<div theme='divider' />
			<Typography
				type='p1'
				theme='row_fill_start'
				label='What to expect when you hire me.'
			/>
			<div theme='column_fill' style={{ gap: 20 }}>
				<ol>
					<ListItem each={process} arr={process} />
				</ol>
			</div>
		</div>


		<div theme='column_center_fill' style={{ gap: 10 }}>
			<Typography theme='row_fill_start' type='h2' label='Prerequisites' />
			<div theme='divider' />
			<Typography
				type='p1'
				theme='row_fill_start'
				label="What I\'ll need from you when you hire me."
			/>
			<ul style={{ paddingLeft: 25 }}>
				<ListItem each={prerequisites} arr={prerequisites} />
			</ul>
		</div>

		<div theme='column_center_fill' style={{ gap: 10 }}>
			<Typography theme='row_fill_start' type='h2' label='Pricing' />
			<div theme='divider' />
			<div theme='row_fill_start'>
				<Typography
					type='p1'
				>
					What you'll pay when you hire me. <b>Founding client pricing!</b>
				</Typography>
			</div>
			<ul style={{ paddingLeft: 25 }}>
				<ListItem each={pricing} arr={pricing} />
			</ul>
		</div>

		<div
			ref={contactRef}
			theme={[
				'column_center_fill_radius',
				Observer.timer(500).map(t => t % 2 === 1 && focused.get() ? 'focused' : null)
			]}
			style={{ gap: 10 }}
			onMouseDown={() => {
				focused.set(false);
			}}
			onMouseEnter={() => {
				focused.set(false);
			}}
		>
			<Typography theme='row_fill_start' type='h2' label="Interested? Let\'s talk! " />
			<div theme='divider' />
			<Typography
				type='p1'
				theme='row_fill_start'
			>
				Fill out the form bellow, email me directly, or dm me on LinkedIn. Either way I'll get back to you quickly!
			</Typography>
			<div>
			</div>
			<Shown value={submitted}>
				<mark:then>
					<div theme='row_fill_radius_primary' style={{ background: '$color', color: '$contrast_text($color_top)', padding: 20 }}>
						<div theme='column_fill'>
							<Typography type='h2_primary' label='Received!' style={{ color: '$contrast_text($color_top)' }} />
							<Typography type='body' label='Thank you for reaching out, I will get back to you shortly.' style={{ color: '$contrast_text($color_top)' }} />
						</div>
						<Icon name='feather:check' size={40} style={{ color: '$contrast_text($color_top)' }} />
					</div>
				</mark:then>
				<mark:else>
					<FormThing />
				</mark:else>
			</Shown>
		</div>
	</>;
}));

export default Services;
