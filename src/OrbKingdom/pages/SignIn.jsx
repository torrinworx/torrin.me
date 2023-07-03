import React, { useState } from "react";
import { Button, TextField, Grid } from "@mui/material";
import { Client } from "@heroiclabs/nakama-js";

const client = new Client("defaultkey", "127.0.0.1", 7350, false);

const SignIn = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSignUp = () => {
        client.authenticateEmail(email, password, username)
            .then(session => {
                console.log("Signed up successfully!");
                onLoginSuccess(session);
            })
            .catch(error => {
                console.error("Sign-up failed:", error);
            });
    };

    const handleLogin = () => {
        client.authenticateEmail(email, password)
            .then(session => {
                console.log("Logged in successfully!");
                onLoginSuccess(session);
            })
            .catch(error => {
                console.error("Login failed:", error);
            });
    };

    const handleGoogleLogin = () => {
        // Implement Google login functionality
    };

    return (
        <Grid container direction="column" spacing={2}>
            <Grid item>
                <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Grid>
            <Grid item>
                <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </Grid>
            <Grid item>
                <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Grid>
            <Grid item>
                <Button onClick={handleSignUp}>Sign Up</Button>
            </Grid>
            <Grid item>
                <Button onClick={handleLogin}>Log In</Button>
            </Grid>
            <Grid item>
                <Button onClick={handleGoogleLogin}>Log In with Google</Button>
            </Grid>
        </Grid>
    );
};

export default SignIn;
