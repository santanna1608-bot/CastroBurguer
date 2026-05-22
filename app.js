/**
 * Castro Burguer - Scroll Video Control & Interactive Script
 * Vanilla JS implementado com técnicas avançadas de renderização (Apple-style Scrubbing)
 */

document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('hero-video');
    const heroSection = document.getElementById('hero-section');
    const steps = document.querySelectorAll('.hero-step');
    const header = document.getElementById('main-header');
    
    // 1. Controle do Menu Mobile
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('open');
            navMenu.classList.toggle('open');
            document.body.classList.toggle('mobile-nav-active');
        });
        
        // Fechar menu ao clicar em qualquer link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuToggle.classList.remove('open');
                navMenu.classList.remove('open');
                document.body.classList.remove('mobile-nav-active');
            });
        });
    }

    // 2. Mudança de Estilo do Header no Scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, { passive: true });

    // 3. Filtros do Cardápio Interativo
    const filterButtons = document.querySelectorAll('.filter-btn');
    const cardapioItems = document.querySelectorAll('.cardapio-item');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover classe active de todos os botões e adicionar no clicado
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const filterValue = button.getAttribute('data-filter');
            
            cardapioItems.forEach(item => {
                const category = item.getAttribute('data-category');
                if (filterValue === 'todos' || category === filterValue) {
                    item.style.display = 'flex';
                    // Pequeno delay para animação de fade-in
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // 4. Lógica de Scroll Video (Apple-style Scrubbing Reverso com Interpolação Suave LERP)
    
    // Adiciona hash anti-cache para recarregar o vídeo limpo
    video.src = 'assets/hero_video_keyframed.mp4?v=' + Date.now();
    video.load();

    // Valores para a interpolação linear (LERP) para suavidade cinematográfica
    let targetFraction = 0;
    let currentFraction = 0;
    const easeFactor = 0.05; // Coeficiente super-smooth (Deslize mais elástico e fluido, como manteiga)
    let animationFrameId = null;
    let isScrollActive = false;

    // Calcula a fração do scroll do usuário dentro da seção hero
    function getScrollFraction() {
        const rect = heroSection.getBoundingClientRect();
        
        // Altura total rolável dentro da hero
        const scrollHeight = heroSection.offsetHeight - window.innerHeight;
        if (scrollHeight <= 0) return 0;
        
        // Posição de rolagem relativa ao topo da seção hero
        const scrollY = -rect.top;
        
        // Limita a fração estritamente entre 0 e 1
        const fraction = Math.max(0, Math.min(1, scrollY / scrollHeight));
        return fraction;
    }

    // Loop de renderização contínua (só roda quando necessário para economizar CPU)
    function renderLoop() {
        // Cálculo do LERP (Linear Interpolation)
        const diff = targetFraction - currentFraction;
        
        // Estabilização mais tolerante para encerramento precoce do motor
        if (Math.abs(diff) < 0.001) {
            currentFraction = targetFraction;
            updateVideoFrame(currentFraction);
            updateTexts(currentFraction);
            animationFrameId = null; // Parar o loop
            return;
        }
        
        // Aplica o deslizamento suave
        currentFraction += diff * easeFactor;
        
        // Atualiza vídeo e textos com base na fração interpolada
        updateVideoFrame(currentFraction);
        updateTexts(currentFraction);
        
        // Continua o loop de animação
        animationFrameId = requestAnimationFrame(renderLoop);
    }

    // Variável para armazenar o último tempo desenhado
    let lastVideoTime = -1;

    // Atualiza o frame do vídeo de acordo com o progresso do scroll (Reverso)
    function updateVideoFrame(fraction) {
        if (!video.duration || isNaN(video.duration)) return;
        
        // Modo Reverso: (1 - scrollFraction)
        const targetTime = video.duration * (1 - fraction);
        
        // Com a GPU livre do filtro de vidro no celular, podemos atualizar a taxa máxima de quadros.
        // Diferença mínima de tempo requerida é baixíssima para garantir frames contínuos (60fps)
        if (Math.abs(targetTime - lastVideoTime) > 0.005) {
            video.currentTime = targetTime;
            lastVideoTime = targetTime;
        }
    }

    // Atualiza as opacidades dos textos que descrevem os passos do hambúrguer
    function updateTexts(fraction) {
        steps.forEach(step => {
            const start = parseFloat(step.getAttribute('data-progress-start'));
            const end = parseFloat(step.getAttribute('data-progress-end'));
            
            // Adiciona classe ativa com uma margem de fade
            if (fraction >= start && fraction <= end) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        
        // Atualiza a classe ativa nos links do menu baseando-se no scroll geral do site
        updateActiveNavLink();
    }

    // Gerencia o link ativo do menu superior conforme a seção visível
    function updateActiveNavLink() {
        const scrollPos = window.scrollY + 200;
        const sections = ['hero-section', 'cardapio', 'sobre', 'contato'];
        const navLinks = document.querySelectorAll('.nav-link');
        
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const top = el.offsetTop;
                const bottom = top + el.offsetHeight;
                
                if (scrollPos >= top && scrollPos < bottom) {
                    navLinks.forEach(link => {
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        } else {
                            link.classList.remove('active');
                        }
                    });
                }
            }
        });
    }

    // Inicialização da física de seek imediato para evitar engasgos ou tela em branco
    let initialized = false;

    function initVideoScroll() {
        if (initialized) return;
        initialized = true;

        const fraction = getScrollFraction();
        targetFraction = fraction;
        currentFraction = fraction;

        // Ouvir uma ÚNICA VEZ a flag 'seeked' para o primeiro seek.
        // Isso garante que o vídeo só receberá a classe .ready (mudando opacidade de 0 para 1)
        // quando o primeiro frame correspondente ao scroll correto for devidamente carregado.
        const onFirstSeek = () => {
            video.classList.add('ready');
            video.removeEventListener('seeked', onFirstSeek);
            
            // Registra as atualizações subsequentes no scroll atreladas ao renderLoop
            setupScrollUpdates();
        };

        video.addEventListener('seeked', onFirstSeek);
        
        // Executa a matemática imediatamente para posicionar no frame correto
        updateVideoFrame(fraction);
        updateTexts(fraction);
    }

    // Escuta os metadados do vídeo
    video.addEventListener('loadedmetadata', initVideoScroll);
    
    // Fallback: se os metadados já foram carregados antes dos listeners (cache do navegador)
    if (video.readyState >= 1) {
        initVideoScroll();
    }

    // Configuração dos eventos de scroll pós-inicialização
    function setupScrollUpdates() {
        window.addEventListener('scroll', () => {
            targetFraction = getScrollFraction();
            
            // Inicia o renderLoop se ele não estiver rodando ativamente
            if (animationFrameId === null) {
                animationFrameId = requestAnimationFrame(renderLoop);
            }
        }, { passive: true });
    }
});
