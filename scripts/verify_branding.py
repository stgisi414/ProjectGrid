
import asyncio
import subprocess
import time
from playwright.async_api import async_playwright

async def verify_branding():
    # Start the development server
    server = subprocess.Popen(["npm.cmd", "run", "dev"], cwd=r"C:\code2\project-grid", shell=True)
    time.sleep(5)  # Wait for the server to start

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            await page.goto("http://localhost:5173")

            # Verify the main logo is present
            main_logo = await page.query_selector('img[src*="project_grid_logo.png"]')
            if main_logo:
                print("Main logo (project_grid_logo.png) found.")
            else:
                print("Main logo (project_grid_logo.png) not found.")

            # Verify the LogoIcon is present
            logo_icon = await page.query_selector('svg[data-testid="logo-icon"]')
            if logo_icon:
                print("LogoIcon component found.")
            else:
                print("LogoIcon component not found.")

        finally:
            await browser.close()
            server.terminate()

if __name__ == "__main__":
    asyncio.run(verify_branding())
