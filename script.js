class Blob {
    constructor(container, color) {
        this.container = container;
        this.element = document.createElement('div');
        this.element.className = 'blob';
        
        // Initialize properties
        this.size = Math.random() * 150 + 100;
        this.baseSize = this.size;
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.mass = this.size / 50;
        this.color = color;
        this.squishFactor = 0;
        this.collisionCount = 0;
        this.lastCollisionFrame = 0;
        
        // Visual setup
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size}px`;
        this.element.style.background = this.color;
        this.element.style.borderRadius = '50%';
        this.updatePosition();
        
        // Create pulse element
        this.pulse = document.createElement('div');
        this.pulse.className = 'pulse';
        this.pulse.style.background = this.color;
        this.element.appendChild(this.pulse);
        
        container.appendChild(this.element);
    }

    updatePosition() {
        // Fix: Proper screen wrapping
        if (this.x < -this.size) this.x = window.innerWidth + this.size/2;
        if (this.x > window.innerWidth + this.size) this.x = -this.size/2;
        if (this.y < -this.size) this.y = window.innerHeight + this.size/2;
        if (this.y > window.innerHeight + this.size) this.y = -this.size/2;

        // Apply squish effect
        const squishAmount = 0.2 * this.squishFactor;
        const scaleX = 1 + squishAmount;
        const scaleY = 1 - squishAmount;
        
        this.element.style.transform = `translate(${this.x}px, ${this.y}px) scale(${scaleX}, ${scaleY})`;
        this.squishFactor *= 0.9; // Gradually reduce squish
    }

    triggerPulse() {
        this.pulse.style.animation = 'none';
        this.pulse.offsetHeight; // Trigger reflow
        this.pulse.style.animation = 'pulse-animation 0.6s ease-out forwards';
    }

    update(blobs) {
        // Check for collisions
        this.checkCollisions(blobs);
        
        // Update position with velocity
        this.x += this.vx;
        this.y += this.vy;

        // Apply very slight damping
        this.vx *= 0.998;
        this.vy *= 0.998;

        // Enforce maximum velocity
        const maxSpeed = 8;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }

        this.updatePosition();
    }

    checkCollisions(blobs) {
        // Skip collision checks if we just had one
        if (this.collisionCount > 0 && performance.now() - this.lastCollisionFrame < 16) {
            this.collisionCount--;
            return;
        }

        const repelStrength = 0.5;
        
        blobs.forEach(other => {
            if (other === this) return;
            
            // Calculate distance with proper wrapping
            let dx = other.x - this.x;
            let dy = other.y - this.y;
            
            // Fix: More accurate wrapping distance calculation
            if (Math.abs(dx) > window.innerWidth / 2) {
                dx = dx > 0 ? dx - window.innerWidth : dx + window.innerWidth;
            }
            if (Math.abs(dy) > window.innerHeight / 2) {
                dy = dy > 0 ? dy - window.innerHeight : dy + window.innerHeight;
            }
            
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (this.size/2) + (other.size/2);
            
            if (distance < minDistance) {
                this.collisionCount = 3; // Skip next 3 frames
                this.lastCollisionFrame = performance.now();
                
                const angle = Math.atan2(dy, dx);
                const force = repelStrength * (minDistance - distance) / minDistance;
                
                this.vx -= Math.cos(angle) * force;
                this.vy -= Math.sin(angle) * force;
                other.vx += Math.cos(angle) * force;
                other.vy += Math.sin(angle) * force;
                
                const collisionStrength = Math.min(1, (minDistance - distance) / 10);
                this.squishFactor = Math.max(this.squishFactor, collisionStrength);
                other.squishFactor = Math.max(other.squishFactor, collisionStrength);
            }
        });
    }

    applyForce(forceX, forceY) {
        this.vx += forceX * 1.5;
        this.vy += forceY * 1.5;
        this.squishFactor = 1;
        this.triggerPulse();
    }
}

class BlobAnimator {
    constructor() {
        this.container = document.getElementById('blobs-container');
        this.blobs = [];
        this.themes = [
            { 
                name: "Normal",
                class: "theme-normal",
                colors: [
                    'rgba(168, 230, 207, 0.9)',  // green
                    'rgba(212, 165, 230, 0.9)',  // purple
                    'rgba(165, 199, 230, 0.9)',  // blue
                    'rgba(255, 170, 165, 0.9)',  // red
                    'rgba(255, 211, 182, 0.9)'   // yellow
                ],
                logoFilter: null
            },
            { 
                name: "Winter",
                class: "theme-winter",
                colors: [
                    'rgba(200, 230, 255, 0.9)',  // light blue
                    'rgba(220, 240, 255, 0.9)',  // pale blue
                    'rgba(180, 220, 255, 0.9)',  // medium blue
                    'rgba(230, 240, 250, 0.9)',  // frost white
                    'rgba(160, 210, 255, 0.9)'   // deep winter blue
                ],
                logoFilter: "brightness(1.2) contrast(0.9)"
            },
            { 
                name: "Fall",
                class: "theme-fall",
                colors: [
                    'rgba(230, 170, 100, 0.9)',  // pumpkin
                    'rgba(200, 120, 80, 0.9)',   // rust
                    'rgba(230, 150, 90, 0.9)',   // amber
                    'rgba(180, 100, 60, 0.9)',   // cinnamon
                    'rgba(210, 140, 70, 0.9)'    // caramel
                ],
                logoFilter: "sepia(0.3) brightness(0.9)"
            },
            { 
                name: "Summer",
                class: "theme-summer",
                colors: [
                    'rgba(255, 200, 100, 0.9)',  // sunshine
                    'rgba(100, 230, 180, 0.9)',  // mint
                    'rgba(255, 120, 120, 0.9)',  // coral
                    'rgba(100, 200, 255, 0.9)',  // sky blue
                    'rgba(230, 100, 230, 0.9)'   // pink
                ],
                logoFilter: "saturate(1.5)"
            },
            { 
                name: "Chaotic",
                class: "theme-chaotic",
                colors: [
                    'rgba(255, 0, 100, 0.9)',    // hot pink
                    'rgba(0, 255, 200, 0.9)',    // electric teal
                    'rgba(255, 200, 0, 0.9)',    // bright yellow
                    'rgba(150, 0, 255, 0.9)',    // purple
                    'rgba(0, 255, 50, 0.9)'      // neon green
                ],
                logoFilter: "contrast(1.5) hue-rotate(90deg)"
            }
        ];
        this.currentTheme = 0;
        this.lastShakeTime = 0;
        this.themeChangeCooldown = 2000; // 2 seconds between theme changes
        
        this.setupPreloader();
        this.init();
    }
    
    setupPreloader() {
        const preloader = document.createElement('div');
        preloader.id = 'preloader';
        preloader.innerHTML = `
            <div class="spinner">
                <div class="blob-spinner" style="background: rgba(168, 230, 207, 0.9)"></div>
                <div class="blob-spinner" style="background: rgba(212, 165, 230, 0.9)"></div>
                <div class="blob-spinner" style="background: rgba(165, 199, 230, 0.9)"></div>
            </div>
        `;
        document.body.appendChild(preloader);
        
        window.addEventListener('load', () => {
            setTimeout(() => {
                preloader.style.opacity = '0';
                setTimeout(() => preloader.remove(), 500);
            }, 500);
        });
    }
    
    init() {
        // Create blobs with initial theme
        this.themes[this.currentTheme].colors.forEach(color => {
            this.blobs.push(new Blob(this.container, color));
        });
        
        // Apply initial theme
        this.applyTheme(this.themes[this.currentTheme]);
        
        // Set up interactions
        this.setupLogoEffects();
        this.setupShakeButton();
        this.setupDeviceMotion();
        
        // Start animation loop
        this.animate();
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    animate() {
        this.blobs.forEach(blob => blob.update(this.blobs));
        requestAnimationFrame(this.animate.bind(this));
    }
    
    setupLogoEffects() {
        const logo = document.getElementById('logo');
        const sparkle1 = document.createElement('div');
        sparkle1.className = 'sparkle';
        logo.appendChild(sparkle1);
        
        const sparkle2 = document.createElement('div');
        sparkle2.className = 'sparkle';
        logo.appendChild(sparkle2);
        
        const triggerThemeChange = () => {
            this.changeTheme();
            const randomColor = this.themes[this.currentTheme].colors[
                Math.floor(Math.random() * this.themes[this.currentTheme].colors.length)
            ];
            sparkle1.style.background = `radial-gradient(circle, ${randomColor} 0%, transparent 70%)`;
            sparkle2.style.background = `radial-gradient(circle, white 0%, transparent 70%)`;
            this.triggerShake(true);
        };
        
        logo.addEventListener('mouseenter', triggerThemeChange);
        logo.addEventListener('touchstart', triggerThemeChange, { passive: true });
    }
    
    triggerShake(strongForce = false) {
        this.blobs.forEach(blob => {
            const forceMultiplier = strongForce ? 6 : 3;
            blob.applyForce(
                (Math.random() - 0.5) * forceMultiplier,
                (Math.random() - 0.5) * forceMultiplier
            );
        });
        
        const content = document.querySelector('.content');
        content.classList.add('shake-effect');
        setTimeout(() => content.classList.remove('shake-effect'), 500);
    }
    
    setupShakeButton() {
        const shakeBtn = document.getElementById('shake-btn');
        if (shakeBtn) {
            shakeBtn.addEventListener('click', () => {
                this.changeTheme();
                this.triggerShake();
            });
        }
    }
    
    setupDeviceMotion() {
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', (e) => {
                const now = Date.now();
                if (now - this.lastShakeTime < this.themeChangeCooldown) return;
                
                const acc = e.accelerationIncludingGravity;
                if (acc && (Math.abs(acc.x) > 15 || Math.abs(acc.y) > 15 || Math.abs(acc.z) > 15)) {
                    this.changeTheme();
                    this.triggerShake();
                    this.lastShakeTime = now;
                }
            });
        }
    }

    changeTheme() {
        this.currentTheme = (this.currentTheme + 1) % this.themes.length;
        const theme = this.themes[this.currentTheme];
        this.applyTheme(theme);
        this.showThemeNotification(theme.name);
    }

    applyTheme(theme) {
        // Remove all theme classes first
        document.body.classList.remove(
            'theme-normal', 'theme-winter', 'theme-fall', 'theme-summer', 'theme-chaotic'
        );
        
        // Apply new theme class
        document.body.classList.add(theme.class);
        
        // Update blob colors
        this.blobs.forEach((blob, i) => {
            const colorIndex = i % theme.colors.length;
            blob.color = theme.colors[colorIndex];
            blob.element.style.background = blob.color;
            blob.pulse.style.background = blob.color;
        });

        // Update logo filter
        const logo = document.getElementById('logo');
        if (theme.logoFilter) {
            logo.style.filter = `${theme.logoFilter} drop-shadow(0 0 10px rgba(255, 255, 255, 0.2))`;
        } else {
            logo.style.filter = 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.2))';
        }
    }

    showThemeNotification(themeName) {
        // Remove existing notification if present
        const existingNotification = document.getElementById('theme-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create new notification
        const notification = document.createElement('div');
        notification.id = 'theme-notification';
        notification.textContent = `${themeName} Theme`;
        document.body.appendChild(notification);
        
        // Auto-hide after 2 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 2000);
    }
    
    handleResize() {
        this.blobs.forEach(blob => {
            blob.x = Math.max(-blob.size, Math.min(window.innerWidth + blob.size, blob.x));
            blob.y = Math.max(-blob.size, Math.min(window.innerHeight + blob.size, blob.y));
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BlobAnimator();
});