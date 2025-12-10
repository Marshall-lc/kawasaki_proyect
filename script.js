document.addEventListener('DOMContentLoaded', () => {

    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuLinks = mobileMenu.querySelectorAll('a');

    const toggleMenu = () => {
        mobileMenu.classList.toggle('hidden');
        mobileMenu.classList.toggle('flex');
        document.body.classList.toggle('overflow-hidden');
    };

    menuBtn.addEventListener('click', toggleMenu);
    menuLinks.forEach(link => link.addEventListener('click', toggleMenu));

    const header = document.getElementById('main-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('bg-zinc-950', 'shadow-lg');
        } else {
            header.classList.remove('bg-zinc-950', 'shadow-lg');
        }
    });

    const scrollElements = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    scrollElements.forEach(el => observer.observe(el));

    // --- GEMINI API ---

    const storyBtn = document.getElementById('generate-story-btn');
    const storyPrompt = document.getElementById('story-prompt');
    const storyResult = document.getElementById('story-result');
    const storySpinner = document.getElementById('story-spinner');

    const planBtn = document.getElementById('generate-plan-btn');
    const trackSelect = document.getElementById('track-select');
    const planResult = document.getElementById('plan-result');
    const planSpinner = document.getElementById('plan-spinner');

    const exponentialBackoff = async (fn, retries = 5, delay = 1000) => {
        try {
            return await fn();
        } catch (error) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
                return exponentialBackoff(fn, retries - 1, delay * 2);
            } else {
                throw error;
            }
        }
    };

    const callGeminiApi = async (userQuery, systemPrompt) => {
        const apiKey = "";
        const apiUrl = `https://generativelace.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
        };

        const fetchApi = async () => {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status >= 500) {
                    throw new Error(response.statusText);
                }
                return { error: `Error ${response.status}: ${errorData?.error?.message}` };
            }

            return response.json();
        };

        const result = await exponentialBackoff(fetchApi);

        if (result.error) return `Error: ${result.error}`;

        const c = result.candidates?.[0];
        return c?.content?.parts?.[0]?.text || "No se pudo generar respuesta.";
    };

    storyBtn.addEventListener('click', async () => {
        const prompt = storyPrompt.value;
        if (!prompt) {
            storyResult.textContent = "Por favor escribe una sensación.";
            return;
        }

        storyBtn.disabled = true;
        storySpinner.style.display = 'inline-block';
        storyResult.textContent = "Generando historia...";

        const userQuery = `Genera una historia sobre '${prompt}' con la H2R.`;
        const systemPrompt = "Eres un escritor poético de alto rendimiento.";

        try {
            const response = await callGeminiApi(userQuery, systemPrompt);
            storyResult.textContent = response;
        } catch {
            storyResult.textContent = "Error al generar historia.";
        }

        storySpinner.style.display = 'none';
        storyBtn.disabled = false;
    });

    planBtn.addEventListener('click', async () => {
        const track = trackSelect.value;

        planBtn.disabled = true;
        planSpinner.style.display = 'inline-block';
        planResult.textContent = `Generando plan para ${track}...`;

        const userQuery = `Genera un itinerario para un track day en ${track}.`;
        const systemPrompt = "Eres un instructor de pista profesional.";

        try {
            const response = await callGeminiApi(userQuery, systemPrompt);
            planResult.textContent = response;
        } catch {
            planResult.textContent = "Error al generar plan.";
        }

        planSpinner.style.display = 'none';
        planBtn.disabled = false;
    });
});
