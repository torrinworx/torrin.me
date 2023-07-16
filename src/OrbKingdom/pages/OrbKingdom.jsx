import React, { useEffect, useState } from "react";
import { Grid, Typography } from "@mui/material";
import { Client } from "@heroiclabs/nakama-js";
import { v4 as uuidv4 } from "uuid";

import FloatingCard from "../../Components/FloatingCard";
import { contentMargin } from "../../Theme";

export const OrbKingdom = () => {
    const [account, setAccount] = useState(null);
    const [leaderboard, setLeaderboard] = useState(null);

    useEffect(() => {
        // Initialize client
        const client = new Client("defaultkey", "127.0.0.1", 7350, false);

        // Generate a unique device ID if it doesn't exist
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = uuidv4();
            localStorage.setItem('device_id', deviceId);
        }

        client.authenticateDevice(deviceId).then(session => {
            console.log("Authenticated successfully!");

            // Get account details
            client.getAccount(session).then(account => {
                setAccount(account);
                console.log("Account details retrieved:", account);
            }).catch(error => {
                console.error("Error retrieving account details:", error);
            });

            // Get leaderboard records
            client.listLeaderboardRecords(session, "global").then(leaderboardRecords => {
                setLeaderboard(leaderboardRecords);
                console.log("Leaderboard records retrieved:", leaderboardRecords);
            }).catch(error => {
                console.error("Error retrieving leaderboard records:", error);
            });

        }).catch(error => {
            console.error("Authentication failed:", error);
        });
    }, []);

    return (
        <Grid container spacing={contentMargin} justifyContent="center" style={{ height: '100%' }}>
            <FloatingCard
                type="translucentSecondary"
                size="large"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
                <Typography variant="h1" style={{ marginBottom: '20px' }}>Nakama Test Page</Typography>

                {account && (
                    <Typography variant="h6">Account Info: {JSON.stringify(account)}</Typography>
                )}

                {leaderboard && (
                    <Typography variant="h6">Leaderboard Records: {JSON.stringify(leaderboard)}</Typography>
                )}

            </FloatingCard>
        </Grid>
    );
};

export default OrbKingdom;
