import React, { useState, useContext } from "react";
import { Grid, Typography, Button, Box, Link } from "@mui/material";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";

import Api from '../Api';
import FloatingCard from "../Components/FloatingCard";
import { ThemeContext, contentMargin } from "../Theme";

const sitekey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

const Contact = () => {
    const { selectedPalette } = useContext(ThemeContext);

    const [isVerified, setIsVerified] = useState(false);
    const [contactInfo, setContactInfo] = useState(null);
    const { executeRecaptcha } = useGoogleReCaptcha();

    const handleCaptchaVerification = async () => {
        if (executeRecaptcha) {
            const token = await executeRecaptcha("homepage");
            if (token) {
                // If captcha is verified, fetch contact information from the server
                Api.fetchContactInfo(token)
                    .then(data => {
                        setContactInfo(data);
                        setIsVerified(true);
                    })
                    .catch(error => {
                        console.error("Captcha verification failed:", error);
                        setIsVerified(false);
                    });
            }
        }
    };

    console.log(`SITE KEY: ${sitekey}`);

    return (
        <FloatingCard type="translucentSecondary">
            <Grid container direction="column" justifyContent="center" alignItems="center">
                <Typography variant="h1" gutterBottom>
                    Contact
                </Typography>
                <Typography variant="body1" paragraph>
                    Wanna chat? Hit me up!
                </Typography>
                <Box>
                    {isVerified ? (
                        <Box>
                            <Typography variant="h6" textAlign="center">Email: {contactInfo?.email}</Typography>
                            <Typography variant="h6" textAlign="center">Discord: {contactInfo?.discord}</Typography>
                        </Box>
                    ) : (
                        <Box textAlign="center">
                            <Button
                                onClick={handleCaptchaVerification}
                                sx={{
                                    my: 2,
                                    fontSize: "18px",
                                    padding: "8px 16px",
                                    color: selectedPalette.colors.text,
                                }}
                            >
                                Verify
                            </Button>
                            <Box
                                color={selectedPalette.colors.text.Link}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    mt: 2,
                                    fontSize: '12px',
                                    marginTop: contentMargin
                                }}
                            >
                                <Link color={"inherit"} href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Privacy Policy</Link>
                                <span>&nbsp;|&nbsp;</span>
                                <Link color={"inherit"} href="https://policies.google.com/terms" target="_blank" rel="noreferrer">Terms of Service</Link>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Grid>
        </FloatingCard>
    );
};

const ReCaptchaWrapper = () => {
    return (
        <Box>
            <style>
                {`
                .grecaptcha-badge {
                    display: none !important;
                }
                `}
            </style>
            <GoogleReCaptchaProvider reCaptchaKey={sitekey}>
                <Contact />
            </GoogleReCaptchaProvider>
        </Box>
    );
};

export default ReCaptchaWrapper;
