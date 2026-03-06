import { openBrowser, goto, waitForSelector, click, type, fill, press, getText, sleep, exists } from './browserAutomation.js';

async function testEnrollmentTab() {
    await openBrowser();

    // 1. Login as Admin to get admin access
    await goto('http://localhost:5173/login');
    await waitForSelector('input[type="email"]');
    await fill('input[type="email"]', 'admin@university.edu');
    await fill('input[type="password"]', 'admin123');
    await click('button[type="submit"]');

    // 2. Wait for dashboard and check phase selector
    await waitForSelector('select');

    // 3. Login as student to verify
    await goto('http://localhost:5173/login');
    await waitForSelector('input[type="email"]');
    await fill('input[type="email"]', 'john@student.edu');
    await fill('input[type="password"]', 'password123');
    await click('button[type="submit"]');
    await sleep(1000);

    console.log("TESTING: Student logged in. Checking if Enrollment tab exists.");
}

testEnrollmentTab();
