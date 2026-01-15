import {
	Typography,
	Shown,
	Validate,
	ValidateContext,
	ThemeContext,
	StageContext,
	Observer,
	Button,
	TextField,
	TextArea,
	Icon,
} from 'destamatic-ui';

const Contact = StageContext.use(s => ThemeContext.use(h => ({ focused }) => {
	if (!(focused instanceof Observer)) focused = Observer.mutable(focused);

	const submitted = Observer.mutable(false);

	const fullName = Observer.mutable('');
	const email = Observer.mutable('');
	const phone = Observer.mutable('');
	const message = Observer.mutable('');
	const submit = Observer.mutable(false);
	const allValid = Observer.mutable(true);

	const blink = 500;
	const blinkTimer = Observer.timer(blink);          // 500ms blink interval
	const forceVisibleUntil = Observer.mutable(0);   // timestamp until which focus is solid

	focused.effect(f => {
		if (!f) return;
		forceVisibleUntil.set(Date.now() + 300); // 300 ms of solid "focused" class
	});

	// combined visual focus state
	const visualFocusTheme = Observer
		.all([blinkTimer, focused, forceVisibleUntil])
		.map(([_, isFocused, until]) => {
			if (!isFocused) return null;

			const now = Date.now();
			if (now < until) {
				return 'focused';
			}

			// after 1s: blink on/off every tick
			return (Math.floor(now / blink) % 2 === 0) ? 'focused' : null;
		});

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

	return <div
		ref
		theme={[
			'column_center_fill_radius',
			visualFocusTheme,
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

		<Shown value={submitted}>
			<mark:then>
				<div
					theme='row_fill_radius_primary'
					style={{
						background: '$color',
						color: '$contrast_text($color_top)',
						padding: 20,
					}}
				>
					<div theme='column_fill'>
						<Typography
							type='h2_primary'
							label='Received!'
							style={{ color: '$contrast_text($color_top)' }}
						/>
						<Typography
							type='body'
							label='Thank you for reaching out, I will get back to you shortly.'
							style={{ color: '$contrast_text($color_top)' }}
						/>
					</div>
					<Icon name='feather:check' size={40} style={{ color: '$contrast_text($color_top)' }} />
				</div>
			</mark:then>

			<mark:else>
				<div theme='column_center_fill' style={{ gap: 10 }}>
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

							{/*
							TODO: Weird issue on mobile when clicking a button that scrolls to this ref, for some reason the text area is focused on
							automatically even though I don't tap on it.
							*/}
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

						<Button
							type="contained"
							label="Submit"
							onClick={async () => {
								submit.set({ value: true });

								if (allValid.get()) {
									await sendContactForm({
										fullName: fullName.get(),
										email: email.get(),
										message: message.get(),
										page: s.observer.path('current').get(),
									});
									submitted.set(true);
								}
							}}
						/>
					</ValidateContext>
				</div>
			</mark:else>
		</Shown>
	</div>;
}));

export default Contact;
