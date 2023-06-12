// src/pages/AresMarketMaster.jsx
import React, { useContext, useEffect, useState } from "react";
import { Grid, Typography } from "@mui/material";
import FloatingCard from "../components/FloatingCard";
import { ThemeContext, contentMargin } from "../Theme";
import Api from '../Api';

export const AresMarketMaster = () => {
    const { selectedPalette } = useContext(ThemeContext);

    // State to hold the API response and error
    const [apiData, setApiData] = useState(null);
    const [apiError, setApiError] = useState(null);

    // useEffect to perform the API request on component mount
    useEffect(() => {
        Api.add(1, 2)
            .then(data => setApiData(data))
    }, []);

    return (
        <Grid container spacing={contentMargin} justifyContent="center">
            <FloatingCard type="invisible" size="medium">
                {/* Display the API response or error */}
                {apiData && (
                    <Typography>
                        API Response: {JSON.stringify(apiData)}
                    </Typography>
                )}
                {apiError && (
                    <Typography color="error">
                        Error: {apiError}
                    </Typography>
                )}
            </FloatingCard>
        </Grid>
    );
};

export default AresMarketMaster;
