export const themeModes = {
    light: {
        name: "light",
        primary: "#D6D6D6",
        text: "#141414",
    },
    dark: {
        name: "dark",
        primary: "#141414",
        text: "#D6D6D6",
    }
}

export const PalettesOptions = (selectedThemeMode) => {

    const palettes = {

        // ### Dark Themes ###
        // https://coolors.co/141414-a30029-660019-666666-d6d6d6
        red: {
            name: "red",
            colors: {
                primary: selectedThemeMode.primary,
                secondary: "#A30029",
                tertiary: "#660019",
                quinary: "#666666",
                text: selectedThemeMode.text,
            },
            materials: {
                primaryMaterial: {
                    color: selectedThemeMode.primary,
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

        // https://coolors.co/141414-6021c0-46188c-666666-d6d6d6
        purple: {
            name: "purple",
            colors: {
                primary: selectedThemeMode.primary,
                secondary: "#6021c0",
                tertiary: "#46188c",
                quinary: "#666666",
                text: selectedThemeMode.text,
            },
            materials: {
                primaryMaterial: {
                    color: selectedThemeMode.primary,
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

        // ### Light Themes ###
        // https://coolors.co/141414-368f8b-246a73-666666-d6d6d6
        cyan: {
            name: "cyan",
            colors: {
                primary: selectedThemeMode.primary,
                secondary: "#368F8B",
                tertiary: "#246A73",
                quinary: "#666666",
                text: selectedThemeMode.text,
            },
            materials: {
                primaryMaterial: {
                    color: selectedThemeMode.primary,
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

        // https://coolors.co/141414-fabc2a-db9b06-666666-d6d6d6
        gold: {
            name: "gold",
            colors: {
                primary: selectedThemeMode.primary,
                secondary: "#FABC2A",
                tertiary: "#DB9B06",
                quinary: "#666666",
                text: selectedThemeMode.text,
            },
            materials: {
                primaryMaterial: {
                    color: selectedThemeMode.primary,
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
    }

    return palettes
};

export default PalettesOptions;
