import React, { useState } from "react";
import { Button, TextField, Typography, Grid, Alert } from "@mui/material";
import { Client } from "@heroiclabs/nakama-js";
import isEmail from 'validator/lib/isEmail';
import FloatingCard from "../../Components/FloatingCard";


const SignUp = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [errorMessage, setErrorMessage] = useState(null);

    const checkUsernameExists = async (username) => {
        // Create a new client
        const client = new Client(process.env.NAKAMA_KEY, process.env.NAKAMA_ADDRESS, process.env.NAKAMA_PORT);
        
        // Create an anonymous session for this RPC call
        const session = await client.authenticateAnonymous();
        
        try {
            // Call the RPC function
            const result = await client.rpc(session, "checkUsernameExists", JSON.stringify({username: username}));
            
            // Parse the result
            const exists = JSON.parse(result.payload).exists;
            
            return exists;
        } catch (error) {
            console.error("Error checking username: ", error);
            return false;
        }
    };
    
    const handleSignUp = async () => {
        // Check username length and existence
        if (username.length < 3 || username.length > 20) {
            setErrorMessage("Username must be between 3 and 20 characters.");
            return;
        } else if (await checkUsernameExists(username)) {
            setErrorMessage("Username is already taken. Please choose another.");
            return;
        }
    

        // Check email format
        if (!isEmail(email)) {
            setErrorMessage("Please provide a valid email address.");
            return;
        }

        // Check password complexity
        if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
            setErrorMessage("Password must be at least 8 characters and include a mix of uppercase, lowercase, and digits.");
            return;
        }

        // Check username length
        
        if (username.length < 3 || username.length > 20) {
            setErrorMessage("Username must be between 3 and 20 characters.");
            return;
        }

        // Create a new client
        const client = new Client(process.env.NAKAMA_KEY, process.env.NAKAMA_ADDRESS, process.env.NAKAMA_PORT);

        const create = true; // set this to true to create the user if they don't exist

        try {
            // Authenticate the user
            const session = await client.authenticateEmail(email, password, create, username);
            console.info(session);
            setErrorMessage(null); // clear any previous error messages
        } catch (error) {
            console.log("Nakama Authentication Error:")
            console.error(error);
            let errorMessage = error.toString();

            // Check for common error messages and provide a more user-friendly message
            if (errorMessage.includes('Username')) {
                setErrorMessage("Username is already taken. Please choose another.");
            } else if (errorMessage.includes('Email')) {
                setErrorMessage("Email is already in use. Please choose another.");
            } else if (errorMessage.includes('connection')) {
                setErrorMessage("Could not connect to the server. Please check your connection and try again.");
            } else {
                // For other errors, fall back to a general error message
                setErrorMessage("An error occurred. Please try again.");
            }
        }
    };

    return (
        <FloatingCard type="translucentSecondary" style={{ height: '100%', display: 'flex', justifyContent: "center", alignItems: "center" }}>
            <Grid container direction="column" spacing={3} alignItems="center" style={{ maxWidth: '500px', width: '100%' }}>
                <Grid item xs={12} style={{ textAlign: 'center' }}>
                    <Typography variant="h1" gutterBottom>
                        OrbKingdom
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="h5" gutterBottom>
                        Sign Up
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        label="Username"
                        variant="outlined"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        label="Email"
                        variant="outlined"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        label="Password"
                        variant="outlined"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={12}>
                    {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
                </Grid>
                <Grid item xs={12}>
                    <Button variant="contained" color="primary" onClick={handleSignUp}>
                        Sign Up
                    </Button>
                </Grid>
            </Grid>
        </FloatingCard>
    );
};


export default SignUp;
