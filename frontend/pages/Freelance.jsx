import { StageContext, Typography, Button, Icon, Shown, Observer, ThemeContext, Paper } from 'destamatic-ui';

import Email from '../utils/Email.jsx';
import useShine from '../utils/Shine.jsx'
import Contact from '../utils/Contact.jsx';

const setup = 200;
const monthly = 30;

const deliverables = [
	{
		bold: 'Professional online presence',
		text: 'A clean, modern, accessible website that makes your business look credible and up to date when people Google you.',
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
];

const prerequisites = [
	{
		bold: 'Iconography & Branding',
		text: 'If you have logos/branding, I\'ll use them. If not, I\'ll still build you a clean, simple theme. I just don\'t design logos from scratch.'
	},
	{
		bold: 'Email',
		text: 'I expect you to already have an email setup for your business. (The email you want customers to reach you with)'
	},
	{
		bold: 'DNS Records Access',
		text: 'If you already have a domain, I\'ll need access to your DNS records to point it to the new site. If this sounds confusing, don\'t worry, I\'ll guide you through it or work with your current provider.'
	},
];

const pricing = [
	{
		bold: 'Setup',
		text: <>A setup fee of <b>${setup} CAD</b> for the work needed to design, implement, and deploy your website.</>,
	},
	{
		bold: 'Maintenance',
		text: <>Recurring fee of <b>${monthly}/month CAD</b> that will cover hosting your website, hosting your stats / lead dashboard, and 5 monthly revisions to keep your website up to date.</>
	},
	{
		bold: 'Additional pages (optional)',
		text: <>If you need more than the standard set of pages, extra pages can be added for <b>$50 CAD per page</b>. This includes page design, implementation, and deployment to your existing site.</>,
	},
];

const hero = [
	<>A <b>clean, modern, accessible</b> site that looks good on phones and computers.</>,
	<>A <b>clear contact/quote form</b> that sends leads straight to your inbox.</>,
	<>One person to call when something breaks. <b>I handle design, development, hosting, security, and updates for you.</b></>,
];

const ListItem = ({ each, arr }) => <li key={arr.indexOf(each)}>
	<Shown value={each.bold}>
		<Typography type='body_bold' label={each.bold + ': '} />
	</Shown>
	<Typography type='body' label={each.text ? each.text : each} />
</li>;

const Freelance = ThemeContext.use(h => StageContext.use(s => ({ }, cleanup, mounted) => {
	const contactRef = Observer.mutable(null);
	const contactFocused = Observer.mutable(false);

	const [shines, createShine] = useShine();
	cleanup(Observer.timer(2000).watch(t => t.value % 2 === 0 && createShine()));
	mounted(() => createShine());

	return <>
		<div theme="content_col_start">
			<div
				theme='row_fill_start'
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 10,
				}}
			>
				<div
					style={{
						flex: '1 1 0',
						minWidth: 0,
					}}
				>
					<Typography
						theme="row_fill_start"
						type="h1"
						label="I Build Websites"
					/>
					<Typography
						theme="row_fill_start"
						type='p1_bold'
						label='Build your business, not websites.'
					/>
				</div>

				<div
					style={{
						flex: '0 0 auto',
						display: 'flex',
						justifyContent: 'flex-end',
					}}
				>
					<img
						src="/headshot.webp"
						theme="primary_focused"
						style={{
							borderRadius: 20,
							width: '20vw',
							maxWidth: 180,
							minWidth: 140,
							height: 'auto',
							objectFit: 'cover',
							display: 'block',
						}}
					/>
				</div>
			</div>

			<div theme="divider" style={{ marginTop: 16 }} />

			<div theme='row_fill_start'>
				<Typography type='body'>
					I design, build, and maintain websites for small businesses in Waterloo Region. <b>You get</b>:
				</Typography>
			</div>

			<ul style={{ paddingLeft: 25 }}>
				<ListItem each={hero} arr={hero} />
			</ul>

			<div
				theme="row_wrap_fill_start"
				style={{
					marginTop: 10,
					gap: 10,
				}}
			>
				<Button
					title="Get in touch about a new or updated website."
					label="Request a website"
					type="contained"
					icon={<Icon name="feather:mail" />}
					iconPosition="right"
					onClick={() => {
						if (contactRef.get()) {
							contactFocused.set(true);
							contactRef.get().scrollIntoView({ behavior: 'smooth', block: 'center' });
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

		<div theme='content_col'>
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

		<div theme='content_col'>
			<Typography theme='row_fill_start' type='h2' label='Pricing' />
			<div theme='divider' />
			<Typography
				type='p1'
				theme='row_fill_start'
			>
				What you'll pay when you hire me.
			</Typography>
			<Paper theme='row_fill' style={{ padding: 20, gap: 10 }}>

				<div theme='column_fill'>
					<Typography type='body_primary'>
						<b>Founding client pricing! My first 5 clients receive a heavily discounted setup fee and locked-in monthly rate.</b> After my first 5 clients, my pricing will increase.
					</Typography>
				</div>
				<Icon name='feather:gift' size={40} />
			</Paper>

			<div theme='row_fill_start'>
				<Typography type='p1'>
					A standard site comes to <b>${setup} setup + ${monthly}/month.</b>
				</Typography>
			</div>
			<ul style={{ paddingLeft: 25 }}>
				<ListItem each={pricing} arr={pricing} />
			</ul>
		</div>

		<Contact ref={contactRef} focused={contactFocused} />

		<div theme='content_col'>
			<Typography theme='row_fill_start' type='h2' label='Why Me?' />
			<div theme='divider' />
			<Typography type='body' label={`I've been a software engineer for ${new Date().getFullYear() - 2021} years, building web apps and tools for companies. I'm now focusing on helping local businesses in Waterloo get simple, effective websites without agency overhead. I'm currently taking on my first 5 small-business clients at a discounted rate while I build out this portfolio. That's why my pricing is lower than typical agencies.`} />
		</div>

		<div theme='content_col'>
			<Typography theme='row_fill_start' type='h2' label='Process' />
			<div theme='divider' />
			<Typography
				type='p1'
				theme='row_fill_start'
				label='What to expect when you hire me.'
			/>
			<Typography type='body' label='My goal is to keep this as low-effort for you as possible. You give me the basics about your business, I handle the tech, and you review the draft twice before we go live.' />
			<div theme='column_fill' style={{ gap: 20 }}>
				<ol>
					<ListItem each={process} arr={process} />
				</ol>
			</div>
		</div>

		<div theme='content_col'>
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

	</>;
}));

export default Freelance;
