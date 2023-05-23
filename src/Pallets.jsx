export const themeModes = {
    light: {
        primary: "#D6D6D6",
        text: "#141414",
    },
    dark: {
        primary: "#141414",
        text: "#D6D6D6",
    }
}

export const pallets = (selectedThemeMode) => {
    // Check if the selected theme mode exists in themeModes
    if (selectedThemeMode in themeModes) {
        const theme = themeModes[selectedThemeMode];

        return {
            red: {
                colors: {
                    primary: theme.primary,
                    secondary: "#A30029",
                    tertiary: "#660019",
                    quinary: "#666666",
                    text: theme.text,
                },
                materials: {
                    primaryMaterial: {
                        color: theme.primary,
                        roughness: 0.5,
                        metalness: 0.2,
                    },
                    secondaryMaterial: {
                        color: "#A30029",
                        roughness: 0.8,
                        metalness: 0,
                        emissiveIntensity: 0,
                        emissive: "#A30029",
                    },
                },
            },
            purple: {
                colors: {
                    primary: theme.primary,
                    secondary: "#6021c0",
                    tertiary: "#46188c",
                    quinary: "#666666",
                    text: theme.text,
                },
                materials: {
                    primaryMaterial: {
                        color: theme.primary,
                        roughness: 0.5,
                        metalness: 0.2,
                    },
                    secondaryMaterial: {
                        color: "#6622CC",
                        roughness: 0.8,
                        metalness: 0,
                        emissiveIntensity: 0.1,
                        emissive: "#A755C2",
                    },
                },
            },
            cyan: {
                colors: {
                    primary: theme.primary,
                    secondary: "#368F8B",
                    tertiary: "#246A73",
                    quinary: "#666666",
                    text: theme.text,
                },
                materials: {
                    primaryMaterial: {
                        color: theme.primary,
                        roughness: 0.5,
                        metalness: 0.2,
                    },
                    secondaryMaterial: {
                        color: "#368F8B",
                        roughness: 0.8,
                        metalness: 0,
                        emissiveIntensity: 0.1,
                        emissive: "#368F8B",
                    },
                },
            },
            gold: {
                colors: {
                    primary: theme.primary,
                    secondary: "#FABC2A",
                    tertiary: "#DB9B06",
                    quinary: "#666666",
                    text: theme.text,
                },
                materials: {
                    primaryMaterial: {
                        color: theme.primary,
                        roughness: 0.5,
                        metalness: 0.2,
                    },
                    secondaryMaterial: {
                        color: "#FABC2A",
                        roughness: 0.5,
                        metalness: 1,
                        emissiveIntensity: 0.1,
                        emissive: "#FABC2A",
                    },
                },
            },
        };
    } else {
        throw new Error('Invalid theme mode');
    }
};

export default pallets;