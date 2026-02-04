const axios = require('axios');

async function testLint() {
    console.log("Testing /api/lint route...");
    try {
        const response = await axios.post('http://localhost:3000/api/lint', {
            path: 'src/app/page.js'
        });
        console.log("Lint Response:", JSON.stringify(response.data, null, 2));
        if (response.data.diagnostics) {
            console.log("SUCCESS: Diagnostics received.");
        } else {
            console.error("FAILURE: No diagnostics field in response.");
        }
    } catch (error) {
        console.error("Test failed:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
}

testLint();
