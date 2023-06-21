const GetBenchmarkScore = () => {
    // Check the number of logical processor cores
    const cores = navigator.hardwareConcurrency || 1;

    // Check the device memory
    const ramGB = navigator.deviceMemory || 1;

    // Check for WebGL and extract renderer information
    let webGLScore = 0;
    let webGLRenderer = 'Unknown';
    try {
        const gl = document.createElement('canvas').getContext('webgl');
        const rendererInfo = gl.getParameter(gl.RENDERER);
        webGLRenderer = rendererInfo;
        webGLScore = rendererInfo.includes("NVIDIA") || rendererInfo.includes("AMD") || rendererInfo.includes("Intel") ? 2 : 1;
    } catch (e) {
        // Handle the error
    }

    // Quick performance test
    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
        Math.random();
    }
    const end = performance.now();
    const timeTaken = end - start;
    const performanceScore = timeTaken < 10 ? 2 : 1;

    // Combine scores (arbitrary weights can be adjusted as needed)
    const score = cores * 1.5 + ramGB * 2 + webGLScore * 2 + performanceScore;

    // Device Type based on the score
    let deviceType = 'Low-Performance Device';
    if (score >= 10 && score < 20) {
        deviceType = 'Mid-Performance Device';
    } else if (score >= 20) {
        deviceType = 'High-Performance Device';
    }

    // Return the object with score and device information
    return {
        score: score,
        deviceType: deviceType,
        logicalProcessors: cores,
        ramGB: ramGB,
        webGLRenderer: webGLRenderer,
        performanceTestTimeTaken: timeTaken
    };
};

const GetRenderingSettings = () => {
    const benchmarkData = GetBenchmarkScore();
    const deviceType = benchmarkData.deviceType;

    let settings;
    switch (deviceType) {
        case 'High-Performance Device':
            settings = {
                dpr: [1, 3],
                shadowMapSize: [1024, 1024],
                antialias: true,
                useShadows: true,
                textureQuality: 'high',
            };
            break;
        case 'Mid-Performance Device':
            settings = {
                dpr: [1, 2],
                shadowMapSize: [512, 512],
                antialias: true,
                useShadows: true,
                textureQuality: 'medium',
            };
            break;
        default: // Low-Performance Device
            settings = {
                dpr: [1, 1],
                shadowMapSize: [256, 256],
                antialias: false,
                useShadows: false,
                textureQuality: 'low',
            };
    }

    return {
        renderingSettings: settings,
        deviceInfo: benchmarkData
    };
};

export default GetRenderingSettings;
