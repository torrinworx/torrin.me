const fonts = `
/* JetBrains Mono*/  

/* 100 Thin */
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-Thin.woff2") format("woff2");
  font-weight: 100;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-ThinItalic.woff2") format("woff2");
  font-weight: 100;
  font-style: italic;
  font-display: swap;
}  

/* 200 ExtraLight */
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-ExtraLight.woff2") format("woff2");
  font-weight: 200;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-ExtraLightItalic.woff2") format("woff2");
  font-weight: 200;
  font-style: italic;
  font-display: swap;
}  

/* 300 Light */
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-Light.woff2") format("woff2");
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-LightItalic.woff2") format("woff2");
  font-weight: 300;
  font-style: italic;
  font-display: swap;
}  

/* 400 Regular */
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-Italic.woff2") format("woff2");
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}  

/* 500 Medium */
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-Medium.woff2") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-MediumItalic.woff2") format("woff2");
  font-weight: 500;
  font-style: italic;
  font-display: swap;
}  

/* 600 SemiBold */
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-SemiBold.woff2") format("woff2");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-SemiBoldItalic.woff2") format("woff2");
  font-weight: 600;
  font-style: italic;
  font-display: swap;
}  

/* 700 Bold */
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-Bold.woff2") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-BoldItalic.woff2") format("woff2");
  font-weight: 700;
  font-style: italic;
  font-display: swap;
}  

/* 800 ExtraBold */
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-ExtraBold.woff2") format("woff2");
  font-weight: 800;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-ExtraBoldItalic.woff2") format("woff2");
  font-weight: 800;
  font-style: italic;
  font-display: swap;
}

/* IBM Plex Sans */

/* IBM Plex Sans (local woff2) */
@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-Thin.woff2") format("woff2");
  font-weight: 100;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-ThinItalic.woff2") format("woff2");
  font-weight: 100;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-ExtraLight.woff2") format("woff2");
  font-weight: 200;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-ExtraLightItalic.woff2") format("woff2");
  font-weight: 200;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-Light.woff2") format("woff2");
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-LightItalic.woff2") format("woff2");
  font-weight: 300;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-Italic.woff2") format("woff2");
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-Text.woff2") format("woff2");
  font-weight: 450;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-TextItalic.woff2") format("woff2");
  font-weight: 450;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-Medium.woff2") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-MediumItalic.woff2") format("woff2");
  font-weight: 500;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-SemiBold.woff2") format("woff2");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-SemiBoldItalic.woff2") format("woff2");
  font-weight: 600;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-Bold.woff2") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-BoldItalic.woff2") format("woff2");
  font-weight: 700;
  font-style: italic;
  font-display: swap;
}

html {
	-webkit-text-size-adjust: none;
	text-size-adjust: none;
}
body {
	text-rendering: optimizeLegibility;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}
`;

export default fonts;
