import asyncio
import re
import sys
import codecs
from playwright.async_api import async_playwright

# Force stdout to use UTF-8 encoding
if sys.stdout.encoding != 'utf-8':
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

async def get_server_url(stream):
    """
    Parses the server output from a stream to find the URL.
    """
    while True:
        try:
            line = await asyncio.wait_for(stream.readline(), timeout=60.0)
            if not line:
                break
            
            line = line.decode('utf-8')
            print(f"Processing line: {line.strip()}")
            if "http://localhost" in line:
                url = line.split("http://localhost")[1].strip()
                url = f"http://localhost{url}"
                print(f"Found server URL: {url}")
                return url
        except asyncio.TimeoutError:
            print("Timeout waiting for server URL.")
            return None
            
    return None

async def verify_link_opens():
    # Start the development server using asyncio's subprocess
    server = await asyncio.create_subprocess_exec(
        "npm.cmd", "run", "dev",
        cwd=r"C:\code2\project-grid",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT
    )

    url = await get_server_url(server.stdout)

    if not url:
        print("Could not find server URL. Exiting.")
        server.terminate()
        return

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()
        
        new_page_opened = False
        
        def on_page(new_page):
            nonlocal new_page_opened
            print(f"New page opened with URL: {new_page.url}")
            new_page_opened = True

        context.on('page', on_page)

        try:
            print(f"Navigating to the application at {url}...")
            await page.goto(url, timeout=120000)
            
            print("Waiting for the project input form to load...")
            await page.wait_for_selector('textarea[placeholder="e.g., An AI-powered mobile app for personal finance that helps users track spending and save money..."]', timeout=120000)
            
            print("Filling out project description...")
            await page.fill('textarea[placeholder="e.g., An AI-powered mobile app for personal finance that helps users track spending and save money..."]', "A new flower seed business")
            
            print("Clicking generate button...")
            await page.click('button:has-text("Generate Project Grid")')
            
            print("Waiting for results to load...")
            await page.wait_for_selector('[data-testid="asset-card-0"]', timeout=120000)
            
            print("Dispatching click event on the first asset card...")
            await page.dispatch_event('[data-testid="asset-card-0"]', 'click')
            
            # Wait a moment for the new page event to fire
            await asyncio.sleep(5)

            if new_page_opened:
                print("\nVerification successful: A new tab was opened.")
            else:
                print("\nVerification failed: No new tab was opened.")

        except Exception as e:
            print(f"An error occurred during the test: {e}")
            print("Page content:")
            print(await page.content())
        finally:
            await browser.close()
            server.terminate()
            await server.wait()

if __name__ == "__main__":
    asyncio.run(verify_link_opens())