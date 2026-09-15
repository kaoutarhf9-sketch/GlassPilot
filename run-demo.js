const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');

console.log("====================================================");
console.log("  GlassPilot 100% Automated Demo Video Recorder");
console.log("====================================================");

// Function to check if local server is listening on port 3000
function checkLocalServer() {
  return new Promise((resolve) => {
    const req = http.request({
      host: 'localhost',
      port: 3000,
      path: '/connexion',
      method: 'GET',
      timeout: 1500
    }, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => resolve(false));
    req.end();
  });
}

// Check and install playwright if not present
try {
  require.resolve('playwright');
  console.log("✓ Playwright is already installed.");
} catch (e) {
  console.log("Playwright is missing. Installing... (This might take a minute)");
  try {
    execSync('npm install -D playwright', { stdio: 'inherit' });
    console.log("Installing Chromium browser binary...");
    execSync('npx playwright install chromium', { stdio: 'inherit' });
    console.log("✓ Playwright & Chromium installed successfully.");
  } catch (err) {
    console.error("❌ Failed to install Playwright. Please run 'npm install -D playwright && npx playwright install chromium' manually.");
    process.exit(1);
  }
}

const { chromium } = require('playwright');

(async () => {
  // Read Env Variables
  let env = {};
  try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    envFile.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        if (key) env[key] = value;
      }
    });
  } catch (e) {
    console.error("❌ Could not read .env.local file. Please make sure it exists.");
    process.exit(1);
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in .env.local");
    process.exit(1);
  }

  // Initialize Admin Client
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Check if port 3000 is active, start dev server if not
  let devProcess = null;
  const isServerRunning = await checkLocalServer();
  if (!isServerRunning) {
    console.log("🚀 Local server not running on port 3000. Launching Next.js dev server...");
    devProcess = spawn('npm', ['run', 'dev'], { shell: true, stdio: 'ignore', detached: false });
    
    // Wait for server to boot
    let retries = 15;
    let started = false;
    while (retries > 0) {
      console.log(`Waiting for local server to be ready (${retries}s remaining)...`);
      await new Promise(r => setTimeout(r, 1000));
      if (await checkLocalServer()) {
        started = true;
        break;
      }
      retries--;
    }
    if (!started) {
      console.error("❌ Failed to start Next.js dev server automatically. Please run 'npm run dev' and try again.");
      if (devProcess) devProcess.kill();
      process.exit(1);
    }
    console.log("✓ Dev server launched successfully.");
  } else {
    console.log("✓ Dev server is already running on port 3000.");
  }

  // Temporary accounts variables
  const demoEmail = `demo_video_${Date.now()}@glasspilot.fr`;
  const demoPassword = "DemoPassword123!";
  let userId = null;
  let garageId = null;

  try {
    console.log("\nCreating temporary demo user account in Supabase...");
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
      user_metadata: {
        role: 'garagiste',
        first_name: 'Garage',
        prenom: 'Démo',
        onboarding_completed: true
      }
    });

    if (userError || !userData?.user) {
      throw new Error(`Failed to create demo user: ${userError?.message || 'unknown error'}`);
    }

    userId = userData.user.id;
    console.log(`✓ Temporary user created with ID: ${userId}`);

    // Create temporary garage
    const { data: garageData, error: garageError } = await supabase
      .from('garages')
      .insert({
        owner_id: userId,
        nom_garage: 'Garage Démo GlassPilot',
        responsable: 'Jean Démo',
        email_contact: demoEmail,
        telephone: '0601020304',
        adresse: '123 Rue de la Paix, 75001 Paris',
        siret: '12345678901234',
        is_active: true
      })
      .select()
      .single();

    if (garageError || !garageData) {
      throw new Error(`Failed to create garage record: ${garageError?.message || 'unknown error'}`);
    }

    garageId = garageData.id;
    console.log(`✓ Temporary garage created with ID: ${garageId}`);

    // Assign mock stock balances to show off the custom cards
    const { error: stockError } = await supabase
      .from('stock_jetons')
      .insert({
        garage_id: garageId,
        simple: 14,
        prestige: 8
      });

    if (stockError) {
      throw new Error(`Failed to assign token stocks: ${stockError.message}`);
    }
    console.log("✓ Assigned token balances: 14 Simple, 8 Prestige.");

    // Launch automation browser
    console.log("\nLaunching Chromium browser and recording demo session...");
    const browser = await chromium.launch({
      headless: false,
      slowMo: 100 // Smooth and natural pacing
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: {
        dir: './demo-videos/',
        size: { width: 1280, height: 720 }
      }
    });

    const page = await context.newPage();
    const localUrl = 'http://localhost:3000';

    // Step 1: Login automatically
    console.log("- Performing automated login...");
    await page.goto(`${localUrl}/connexion`);
    await page.waitForSelector('input[placeholder="garage@exemple.fr"]');
    await page.fill('input[placeholder="garage@exemple.fr"]', demoEmail);
    await page.fill('input[placeholder="••••••••"]', demoPassword);
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]');
    
    // Wait for Dashboard to load
    await page.waitForURL('**/dashboard');
    console.log("✓ Sign-in completed successfully. Navigating to layout...");
    await page.waitForTimeout(3000);

    // Step 2: Go to Dossiers
    console.log("- Navigating to Dossiers tab...");
    await page.click('a[href="/dashboard/dossiers"]');
    await page.waitForTimeout(2500);

    // Step 3: Create Dossier Form Step 1
    console.log("- Opening Create Dossier form...");
    await page.click('a[href="/dashboard/dossiers/nouveau"]');
    await page.waitForTimeout(2000);

    console.log("- Filling Step 1: Client information...");
    await page.fill('input[placeholder="AutoGlass Pro"]', 'Jean Dupont Eurl');
    await page.waitForTimeout(250);
    await page.fill('input[placeholder="Jean"]', 'Pierre');
    await page.waitForTimeout(250);
    await page.fill('input[placeholder="client@email.fr"]', 'pierre.dupont@client.fr');
    await page.waitForTimeout(250);
    await page.fill('input[placeholder="06 12 34 56 78"]', '06 99 88 77 66');
    await page.waitForTimeout(250);
    await page.fill('input[placeholder="123 rue du Commerce"]', '12 Boulevard Malesherbes');
    await page.waitForTimeout(250);
    await page.fill('input[placeholder="75001"]', '75008');
    await page.waitForTimeout(250);
    await page.fill('input[placeholder="Paris"]', 'Paris');
    await page.waitForTimeout(1000);
    
    console.log("- Submitting Step 1...");
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(2000);

    // Step 4: Dossier Form Step 2
    console.log("- Filling Step 2: Vehicle details...");
    await page.fill('input[placeholder="AB-123-CD"]', 'XY-888-ZZ');
    await page.waitForTimeout(300);
    await page.fill('input[placeholder="Peugeot 208"]', 'Tesla Model Y');
    await page.waitForTimeout(300);
    await page.fill('input[placeholder="45000"]', '22400');
    await page.waitForTimeout(600);

    console.log("- Selecting vitrage type...");
    await page.click('button:has-text("Pare-brise")');
    await page.waitForTimeout(1000);

    await page.fill('textarea[placeholder*="Infos pour l\'atelier"]', 'Impact dans le champ de vision principal. Remplacement requis.');
    await page.waitForTimeout(2000);

    console.log("- Submitting Step 2...");
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(2500);

    // Step 5: Tokens Page
    console.log("- Navigating to the custom token purchase page...");
    await page.click('a[href="/dashboard/abonnement"]');
    await page.waitForTimeout(3000);

    console.log("- Displaying custom balance wallet cards and pricing cards...");
    await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
    await page.waitForTimeout(2000);

    console.log("- Clicking quick-select quantity pills for Simple tokens...");
    await page.click('div:has-text("Jeton Simple") >> button:has-text("10")');
    await page.waitForTimeout(1500);
    await page.click('div:has-text("Jeton Simple") >> button:has-text("20")');
    await page.waitForTimeout(1500);

    console.log("- Clicking quick-select quantity pills for Prestige tokens...");
    await page.click('div:has-text("Jeton Prestige") >> button:has-text("5")');
    await page.waitForTimeout(1500);
    await page.click('div:has-text("Jeton Prestige") >> button:has-text("20")');
    await page.waitForTimeout(1500);

    console.log("- Opening Checkout confirmation modal...");
    await page.click('button:has-text("Commander Prestige")');
    await page.waitForTimeout(3000);

    console.log("- Toggling RGPD checkbox...");
    await page.click('label:has-text("J\'accepte que mes données")');
    await page.waitForTimeout(2000);
    await page.click('label:has-text("J\'accepte que mes données")');
    await page.waitForTimeout(1500);

    console.log("- Closing modal...");
    await page.click('button:has-text("Annuler")');
    await page.waitForTimeout(1500);

    // Step 6: Return to Dashboard
    console.log("- Returning to Dashboard...");
    await page.click('a[href="/dashboard"]');
    await page.waitForTimeout(2500);

    console.log("Demo session completed. Saving video and closing browser...");
    await context.close();
    await browser.close();

    console.log("\n====================================================");
    console.log("🎉 SUCCESS!");
    console.log("📹 Demo video recorded and stored under the 'demo-videos/' directory.");
    console.log("====================================================");

  } catch (error) {
    console.error("❌ An error occurred during execution:", error.message);
  } finally {
    // Database cleanup
    console.log("\nPerforming secure database cleanup of demo records...");
    if (garageId) {
      await supabase.from('stock_jetons').delete().eq('garage_id', garageId);
      await supabase.from('garages').delete().eq('id', garageId);
    }
    if (userId) {
      await supabase.auth.admin.deleteUser(userId);
    }
    console.log("✓ Database cleanup finished.");

    if (devProcess) {
      console.log("Stopping Next.js development server background process...");
      devProcess.kill();
    }
  }
})();
