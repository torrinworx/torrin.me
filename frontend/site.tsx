// The whole site: the theme, the one icon a component asks for by name, the acts, and the frame
// every act sits in.
//
// Both halves of the build import this file. `entry.tsx` mounts it in a browser and `pages.ts`
// renders it to files, so the markup a crawler reads is the markup the page comes alive as.

import {
	Button,
	Icon,
	Icons,
	InputContext,
	PopupContext,
	Stage,
	StageContext,
	Theme,
	Typography,
	h,
} from '@aweftjs/ui';
import type { Act } from '@aweftjs/ui';
import type { Router } from '@aweftjs/dom/router';
import alertTriangle from '@aweftjs/icons/feather/alert-triangle';

import { SiteHead } from './head.tsx';
import { siteTheme } from './theme.ts';
import { Contact } from './utils/contact.tsx';
import { Header } from './utils/header.tsx';
import { Landing } from './pages/landing.tsx';
import { NotFound } from './pages/not-found.tsx';

// `Validate` mounts an icon called `triangle-alert`; Feather publishes that drawing under
// `alert-triangle`, so one pack of one icon answers it and no set is bundled.
const icons = { icons: { 'triangle-alert': alertTriangle } };

/** What a click reports. The browser half hands in the log's writer; a render hands in none. */
export type Track = (event: string, options: { props: Record<string, string> }) => void;

const Footer = (): unknown => (
	<div theme="content">
		<div theme={['column', 'center']} style={{ width: '100%', gap: 10 }}>
			<div theme={['row', 'wrap', 'center']} style={{ width: '100%', gap: 10 }}>
				<Button theme="bare" size="icon" style={{ height: 50, width: 50 }}
					title="LinkedIn" aria-label="LinkedIn"
					href="https://www.linkedin.com/in/torrin-leonard-8343a1154/"
					icon={<Icon name="simple-icons:linkedin" size={30} />} />
				<Button theme="bare" size="icon" style={{ height: 50, width: 50 }}
					title="Instagram" aria-label="Instagram"
					href="https://www.instagram.com/torrinleonard/"
					icon={<Icon name="simple-icons:instagram" size={30} />} />
				<Button theme="bare" size="icon" style={{ height: 50, width: 50 }}
					title="GitHub" aria-label="GitHub"
					href="https://github.com/torrinworx"
					icon={<Icon name="simple-icons:github" size={30} />} />
				<Button theme="bare" size="icon" style={{ height: 50, width: 50 }}
					title="GitLab" aria-label="GitLab"
					href="https://gitlab.com/torrin1"
					icon={<Icon name="simple-icons:gitlab" size={30} />} />
				<Button theme="bare" size="icon" style={{ height: 50, width: 50 }}
					title="YouTube" aria-label="YouTube"
					href="https://www.youtube.com/@TorrinZLeonard"
					icon={<Icon name="simple-icons:youtube" size={30} />} />
				<Button theme="bare" size="icon" style={{ height: 50, width: 50 }}
					title="Medium" aria-label="Medium"
					href="https://medium.com/@torrin_49072"
					icon={<Icon name="simple-icons:medium" size={30} />} />
				<Button theme="bare" size="icon" style={{ height: 50, width: 50 }}
					title="dev.to" aria-label="dev.to"
					href="https://dev.to/torrin"
					icon={<Icon name="simple-icons:devdotto" size={30} />} />
				<Button theme="bare" size="icon" style={{ height: 50, width: 50 }}
					title="Hacker News" aria-label="Hacker News"
					href="https://news.ycombinator.com/user?id=torrinleonard"
					icon={<Icon name="simple-icons:ycombinator" size={30} />} />
			</div>
		</div>
		<div theme={['row', 'center', 'wide', 'wrap', 'tight']}>
			<Typography
				style={{ textAlign: 'center' }}
				type="p1"
				label={`© Torrin Leonard ${String(new Date().getFullYear())} 🇨🇦 `}
			/>
		</div>
	</div>
);

/** The frame every act sits in: the head tags, the menu above it and the social row below. */
const Frame = (props: { children?: unknown[] }): unknown => (
	<div theme="page">
		<SiteHead />
		<Header />
		{/* The act is the page's main landmark. Without one a screen reader has no "skip to the
		    content" target, and Lighthouse fails `landmark-one-main`, as the old site did. */}
		<main theme="region">{props.children}</main>
		<Footer />
	</div>
);

export const acts: Record<string, Act> = {
	'': Landing,
	contact: () => <Contact />,
	missing: NotFound,
};

export const Site = (props: { router: Router; track?: Track }): unknown => {
	const track = props.track;
	// Where every click in the page goes. `meta` tags them all as this page's.
	const inputs = {
		meta: { scope: 'root' },
		onClick: (event: Record<string, unknown>) => {
			track?.('click', { props: { id: String(event['label'] ?? event['href'] ?? '') } });
		},
	};

	return (
		<Theme value={siteTheme}>
			<InputContext value={inputs}>
				<Icons value={icons}>
					<PopupContext>
						<StageContext
							router={props.router}
							acts={acts}
							template={Frame}
							fallback="missing"
						>
							<Stage />
						</StageContext>
					</PopupContext>
				</Icons>
			</InputContext>
		</Theme>
	);
};
