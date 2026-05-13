(function () {
  var header = document.querySelector("[data-header]");
  var navToggle = document.querySelector("[data-nav-toggle]");
  var navLinks = document.querySelector("[data-nav-links]");
  var navItems = Array.from(document.querySelectorAll(".nav-links a"));
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Sticky header --- */
  function syncHeader() {
    if (window.scrollY > 20) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }

  function closeNav() {
    document.body.classList.remove("nav-open");
    navLinks.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
  }

  navToggle.addEventListener("click", function () {
    var isOpen = navLinks.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  navItems.forEach(function (item) {
    item.addEventListener("click", closeNav);
  });

  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();

  /* --- Active nav highlight --- */
  var sections = navItems
    .map(function (item) {
      return document.querySelector(item.getAttribute("href"));
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navItems.forEach(function (item) {
            item.classList.toggle("is-active", item.getAttribute("href") === "#" + entry.target.id);
          });
        });
      },
      { rootMargin: "-40% 0px -52% 0px", threshold: 0 }
    );
    sections.forEach(function (section) {
      navObserver.observe(section);
    });
  }

  /* --- Animated counters --- */
  function animateCount(node) {
    var target = Number(node.dataset.count || 0);
    if (!target) return;
    if (reducedMotion) {
      node.textContent = String(target);
      return;
    }

    var duration = 1100;
    var start = performance.now();
    function tick(now) {
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = String(Math.floor(target * eased));
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        node.textContent = String(target);
      }
    }
    requestAnimationFrame(tick);
  }

  var counters = Array.from(document.querySelectorAll("[data-count]"));
  if ("IntersectionObserver" in window) {
    var counterObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.45 }
    );
    counters.forEach(function (counter) {
      counterObserver.observe(counter);
    });
  } else {
    counters.forEach(animateCount);
  }

  /* --- Insight filter --- */
  var filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  var insightCards = Array.from(document.querySelectorAll("[data-topic]"));

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var filter = button.dataset.filter;
      filterButtons.forEach(function (item) {
        item.classList.toggle("is-active", item === button);
      });
      insightCards.forEach(function (card) {
        var isVisible = filter === "all" || card.dataset.topic === filter;
        card.classList.toggle("is-hidden", !isVisible);
      });
    });
  });

  /* --- Contact form --- */
  var CONTACT_ENDPOINT = "https://admin.signifytics.com/api/signifytics";
  var form = document.querySelector("#contactForm");
  var status = document.querySelector("[data-form-status]");
  var submitButton = form.querySelector(".form-submit");

  function setFormStatus(message, state) {
    status.className = "form-status";
    status.textContent = message;
    if (state) {
      status.classList.add(state);
    }
  }

  function setSubmitState(isSending) {
    if (!submitButton) return;
    submitButton.disabled = isSending;
    submitButton.textContent = isSending ? "Sending..." : "Send Inquiry";
  }

  function readResponseBody(response) {
    return response.text().then(function (text) {
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch (error) {
        return text;
      }
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var formData = new FormData(form);
    var payload = {
      email: String(formData.get("email") || "").trim(),
      name: String(formData.get("name") || "").trim(),
      inquiryType: String(formData.get("inquiryType") || "").trim(),
      message: String(formData.get("message") || "").trim()
    };
    var website = String(formData.get("website") || "").trim();

    setFormStatus("");
    if (website) return;
    if (!payload.name || !payload.email || !payload.inquiryType || !payload.message) {
      setFormStatus("Please complete all required fields.", "is-error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      setFormStatus("Please enter a valid email address.", "is-error");
      return;
    }

    setSubmitState(true);
    setFormStatus("Sending your inquiry...");

    fetch(CONTACT_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        return readResponseBody(response).then(function (body) {
          if (!response.ok) {
            var message =
              body && typeof body === "object" && (body.message || body.error)
                ? body.message || body.error
                : "Unable to send your inquiry. Please try again later.";
            throw new Error(message);
          }
          return body;
        });
      })
      .then(function () {
        form.reset();
        setFormStatus("Thank you. Your inquiry has been sent.", "is-success");
      })
      .catch(function (error) {
        console.error("Contact form submission failed:", error);
        setFormStatus(error.message || "Unable to send your inquiry. Please try again later.", "is-error");
      })
      .then(function () {
        setSubmitState(false);
      });
  });

  /* --- Footer year --- */
  var year = document.querySelector("[data-year]");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  /* --- Hero canvas animation --- */
  var canvas = document.querySelector("#marketCanvas");
  var ctx = canvas.getContext("2d");
  var width = 0;
  var height = 0;
  var pixelRatio = 1;
  var pointerX = 0.55;
  var pointerY = 0.4;

  function resizeCanvas() {
    var rect = canvas.getBoundingClientRect();
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function drawGrid(t) {
    ctx.fillStyle = "#08111f";
    ctx.fillRect(0, 0, width, height);

    var offset = (t * 0.018) % 64;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.055)";
    for (var x = -64; x < width + 64; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x + offset, 0);
      ctx.lineTo(x + offset - height * 0.28, height);
      ctx.stroke();
    }
    for (var y = 0; y < height + 80; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y + offset * 0.4);
      ctx.lineTo(width, y + offset * 0.4 - width * 0.12);
      ctx.stroke();
    }
  }

  function drawCurve(t, baseY, color, phase, amp) {
    ctx.beginPath();
    for (var i = 0; i <= width; i += 18) {
      var x = i;
      var y =
        baseY +
        Math.sin(i * 0.012 + t * 0.002 + phase) * amp +
        Math.cos(i * 0.026 + phase) * (amp * 0.42);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawBars(t) {
    var startX = width * 0.52 + pointerX * 24;
    var floor = height * 0.72;
    for (var i = 0; i < 28; i += 1) {
      var h = 28 + Math.abs(Math.sin(i * 0.8 + t * 0.003)) * 118;
      var bx = startX + i * 18;
      var by = floor - h + Math.sin(t * 0.002 + i) * 10;
      ctx.fillStyle = i % 5 === 0 ? "rgba(245,184,75,0.52)" : "rgba(16,184,212,0.34)";
      ctx.fillRect(bx, by, 8, h);
    }
  }

  function drawHeatmap(t) {
    var columns = 11;
    var rows = 5;
    var cell = 34;
    var startX = width * 0.62 + pointerX * 18;
    var startY = height * 0.23 + pointerY * 18;
    for (var row = 0; row < rows; row += 1) {
      for (var col = 0; col < columns; col += 1) {
        var pulse = (Math.sin(t * 0.002 + col * 0.7 + row * 1.2) + 1) / 2;
        var alpha = 0.08 + pulse * 0.24;
        ctx.fillStyle = row === 2 ? "rgba(239,111,92," + alpha + ")" : "rgba(16,185,129," + alpha + ")";
        ctx.fillRect(startX + col * cell, startY + row * cell, cell - 8, cell - 8);
      }
    }
  }

  function render(t) {
    drawGrid(t);
    drawHeatmap(t);
    drawBars(t);
    drawCurve(t, height * 0.36 + pointerY * 22, "rgba(16,184,212,0.72)", 0.4, 40);
    drawCurve(t, height * 0.52 - pointerX * 18, "rgba(124,58,237,0.54)", 2.1, 55);

    var glow = ctx.createLinearGradient(width * 0.45, 0, width, height);
    glow.addColorStop(0, "rgba(29,78,216,0)");
    glow.addColorStop(0.45, "rgba(29,78,216,0.12)");
    glow.addColorStop(1, "rgba(16,185,129,0.2)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    if (!reducedMotion) {
      requestAnimationFrame(render);
    }
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas, { passive: true });
  window.addEventListener(
    "pointermove",
    function (event) {
      pointerX = event.clientX / Math.max(window.innerWidth, 1);
      pointerY = event.clientY / Math.max(window.innerHeight, 1);
    },
    { passive: true }
  );
  requestAnimationFrame(render);
})();
