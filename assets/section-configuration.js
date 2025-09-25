document.addEventListener("DOMContentLoaded", () => {
    const checkboxes = document.querySelectorAll(".product-configuration-checkbox");
    const cartIconBubble = document.getElementById("cart-icon-bubble");
    const ICON_PATHS = {
        empty: "M15.75 11.8h-3.16l-.77 11.6a5 5 0 0 0 4.99 5.34h7.38a5 5 0 0 0 4.99-5.33L28.4 11.8zm0 1h-2.22l-.71 10.67a4 4 0 0 0 3.99 4.27h7.38a4 4 0 0 0 4-4.27l-.72-10.67h-2.22v.63a4.75 4.75 0 1 1-9.5 0zm8.5 0h-7.5v.63a3.75 3.75 0 1 0 7.5 0z",
        filled: "M20.5 6.5a4.75 4.75 0 0 0-4.75 4.75v.56h-3.16l-.77 11.6a5 5 0 0 0 4.99 5.34h7.38a5 5 0 0 0 4.99-5.33l-.77-11.6h-3.16v-.57A4.75 4.75 0 0 0 20.5 6.5m3.75 5.31v-.56a3.75 3.75 0 1 0-7.5 0v.56zm-7.5 1h7.5v.56a3.75 3.75 0 1 1-7.5 0zm-1 0v.56a4.75 4.75 0 1 0 9.5 0v-.56h2.22l.71 10.67a4 4 0 0 1-3.99 4.27h-7.38a4 4 0 0 1-4-4.27l.72-10.67z"
    };
    

    function updateCartIcon(count) {
        const cartLink = document.querySelector(".header-cart");
        if (!cartLink) return;
        
        if (count > 0) {
            let countSpan = cartLink.querySelector(".cart-count");
            
            if (!countSpan) {
                countSpan = document.createElement("span");
                countSpan.className = "cart-count";
                cartLink.appendChild(countSpan);
            }
            
            countSpan.textContent = count;
        } else {
            const countSpan = cartLink.querySelector(".cart-count");
            if (countSpan) countSpan.remove();
        }
        
        if (!cartIconBubble) return;
    
        const path = cartIconBubble.querySelector("svg path");
        const badge = cartIconBubble.querySelector(".cart-count-bubble");
    
    
        if (path) path.setAttribute("d", count > 0 ? ICON_PATHS.filled : ICON_PATHS.empty);
        
        if (count > 0) {
            const visuallyHiddenText = `${count} vare${count > 1 ? 'r' : ''}`;
            if (!badge) {
                const newBadge = document.createElement("div");
                newBadge.className = "cart-count-bubble";
                newBadge.innerHTML = `
                    <span aria-hidden="true">${count}</span>
                    <span class="visually-hidden">${visuallyHiddenText}</span>
                `;
                cartIconBubble.appendChild(newBadge);
            } else {
                badge.querySelector("span[aria-hidden='true']").textContent = count;
                badge.querySelector(".visually-hidden").textContent = visuallyHiddenText;
                badge.style.display = "inline-block";
            }
        } else if (badge) {
            badge.style.display = "none";
        }
    }
        
    async function refreshCartDrawer() {
        try {
            const drawerHTML = await fetch("/cart?view=drawer").then(res => res.text());
            const newDrawer = new DOMParser().parseFromString(drawerHTML, "text/html").querySelector("cart-drawer");
            if (!newDrawer) return;
            
            const currentDrawer = document.querySelector("cart-drawer");
            currentDrawer ? currentDrawer.replaceWith(newDrawer) : document.body.appendChild(newDrawer);
            newDrawer.setAttribute("open", "true");
        } catch (err) {
            console.error("Drawer update error:", err);
        }
    }
    
    async function updateCartState() {
        try {
            const cart = await fetch("/cart.js").then(res => res.json());
            updateCartIcon(cart.item_count);
        } catch (err) {
            console.error("Cart fetch error:", err);
        }
    }
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", async () => {
            if (!checkbox.checked) return;
            
            try {
                await fetch("/cart/add.js", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({ items: [{ id: checkbox.value, quantity: 1 }] })
                });
                
                await refreshCartDrawer();
                await updateCartState();
            } catch (err) {
                console.error("❌ Add to cart error:", err);
            }
        });
    });

    document.body.addEventListener("click", e => {
        const title = e.target.closest(".container-title-configuration");
        if (!title) return;
        
        const content = title.nextElementSibling;
        const isOpen = title.classList.contains("active");
        
        document.querySelectorAll(".container-title-configuration.active").forEach(activeTitle => {
            activeTitle.classList.remove("active");
            const activeContent = activeTitle.nextElementSibling;
            if (activeContent) activeContent.style.maxHeight = null;
        });
        if (!isOpen) {
            title.classList.add("active");
            content.style.maxHeight = content.scrollHeight + "px";
        }
    });
    
    window.addEventListener("resize", () => {
        document.querySelectorAll(".container-title-configuration.active").forEach(activeTitle => {
            const activeContent = activeTitle.nextElementSibling;
            if (activeContent) {
                activeContent.style.maxHeight = activeContent.scrollHeight + "px";
            }
        });
    });

    updateCartState();
});