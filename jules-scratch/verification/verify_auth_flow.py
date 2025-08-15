from playwright.sync_api import sync_playwright, expect
import re

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # --- Test 1: Unauthorized access should redirect to login ---
        print("Test 1: Verifying unauthorized redirect...")
        page.goto("http://localhost:3000/index.html")

        # Expect to be redirected to login.html
        expect(page).to_have_url(re.compile(r".*login\.html\?return=unauthorized"))

        # Expect to see the unauthorized message
        expect(page.get_by_text("Please log in to access the application.")).to_be_visible()
        print("Test 1 Passed: Unauthorized redirect is working correctly.")

        # --- Test 2: Full user registration and login flow ---
        print("\nTest 2: Verifying user registration and login...")

        # Register a new user 'testuser_final'
        page.locator("#user-tab").click()
        page.get_by_label("Username").fill("testuser_final")
        page.get_by_label("Password").fill("password")
        page.locator(".login-btn").click()
        expect(page.get_by_text("Account created!")).to_be_visible()
        print("Step 2.1 Passed: New user registration successful.")

        # Log in as admin
        page.locator("#admin-tab").click()
        page.get_by_label("Username").fill("DG143")
        page.get_by_label("Password").fill("DG143")
        page.locator(".login-btn").click()
        expect(page.get_by_role("heading", name="Admin Dashboard")).to_be_visible()
        print("Step 2.2 Passed: Admin login successful.")

        # Approve the new user
        page.locator("#pending-users").get_by_text("testuser_final").wait_for()
        page.locator(f'[data-username="testuser_final"][data-action="approve"]').click()

        # Wait for the user to move to the active list
        expect(page.locator("#active-users").get_by_text("testuser_final")).to_be_visible()
        print("Step 2.3 Passed: User approval successful.")

        # Log out
        page.get_by_role("button", name="Logout").click()
        expect(page).to_have_url(re.compile(r".*login\.html"))
        print("Step 2.4 Passed: Admin logout successful.")

        # --- Test 3: Authorized user can access the main application ---
        print("\nTest 3: Verifying authorized user access...")

        # Log in as the newly approved user
        page.locator("#user-tab").click()
        page.get_by_label("Username").fill("testuser_final")
        page.get_by_label("Password").fill("password")
        page.locator(".login-btn").click()

        # Expect to be redirected to index.html
        expect(page).to_have_url(re.compile(r".*index\.html"))
        expect(page.get_by_role("heading", name="🚀 SmartSignal Pro v2.1 - Elite AI Edition")).to_be_visible()
        print("Test 3 Passed: Authorized user successfully accessed the main application.")

        # Take the final verification screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")
        print("\nVerification screenshot captured successfully.")

        browser.close()

if __name__ == "__main__":
    run_verification()
