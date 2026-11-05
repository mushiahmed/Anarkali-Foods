/* ===== Anarkali Foods: settings you may want to change ===== */
const CONFIG = {
  whatsappNumber: "923333385676",          // country code + number, no + or spaces
  email: "mushiahmed77@gmail.com",
  businessName: "Anarkali Foods",
  phoneDisplay: "+92 333 3385676",
  minGuests: 10,
  events: ["Barat", "Valima", "Mangni", "Mayoun", "Other"],
  // Add, remove or rename dishes here. Each key becomes a group in the dropdown.
  menu: {
    "Karahi and Gravies": ["Chicken Karahi", "Mutton Karahi", "Chicken Handi", "Chicken Qorma", "Mutton Qorma", "Beef Nihari", "Mutton Paya", "Aloo Gosht", "Daal Makhni", "Palak Paneer"],
    "Rice": ["Chicken Biryani", "Mutton Biryani", "Chicken Pulao", "Mutton Pulao", "Zarda", "Matanjan"],
    "BBQ and Kabab": ["Seekh Kabab", "Chicken Tikka", "Malai Boti", "Reshmi Kabab", "Chapli Kabab", "Shami Kabab", "Chicken Malai Tikka"],
    "Breads": ["Naan", "Roghni Naan", "Tandoori Roti", "Kulcha", "Sheermal"],
    "Starters and Sides": ["Chicken Corn Soup", "Hot and Sour Soup", "Fried Fish", "Russian Salad", "Green Salad", "Raita", "Chutney"],
    "Desserts": ["Gulab Jamun", "Kheer", "Gajar ka Halwa", "Shahi Tukray", "Ras Malai", "Firni", "Kulfi", "Zarda Meethay Chawal"],
    "Drinks": ["Kashmiri Chai", "Qehwa", "Sweet Lassi", "Rooh Afza Sharbat", "Soft Drinks", "Mineral Water"]
  }
};

const $ = (id) => document.getElementById(id);
const form = $("orderForm");
const eventSel = $("event");
const dishSel = $("dishSelect");
let chosen = [];

/* ---------- Build dropdowns ---------- */
CONFIG.events.forEach((e) => eventSel.add(new Option(e, e)));

function buildDishSelect() {
  dishSel.innerHTML = '<option value="">Choose a dish to add</option>';
  for (const [group, dishes] of Object.entries(CONFIG.menu)) {
    const og = document.createElement("optgroup");
    og.label = group;
    dishes.forEach((d) => {
      const o = new Option(d, d);
      o.disabled = chosen.includes(d);
      og.appendChild(o);
    });
    dishSel.appendChild(og);
  }
}

function renderChosen() {
  const list = $("chosen");
  list.innerHTML = "";
  chosen.forEach((d) => {
    const li = document.createElement("li");
    li.append(d);
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = "×";
    b.setAttribute("aria-label", "Remove " + d);
    b.onclick = () => { chosen = chosen.filter((x) => x !== d); renderChosen(); };
    li.appendChild(b);
    list.appendChild(li);
  });
  $("emptyHint").hidden = chosen.length > 0;
  buildDishSelect();
  if (chosen.length) setError("dishes", "");
}

dishSel.addEventListener("change", () => {
  if (dishSel.value && !chosen.includes(dishSel.value)) chosen.push(dishSel.value);
  renderChosen();
});

eventSel.addEventListener("change", () => {
  $("otherWrap").hidden = eventSel.value !== "Other";
});

/* ---------- Date: no past dates ---------- */
const today = new Date();
$("date").min = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
$("guests").min = 1;

/* ---------- Validation ---------- */
function setError(name, msg) {
  const el = document.querySelector('.error[data-for="' + name + '"]');
  if (el) { el.textContent = msg; const f = el.closest(".field"); if (f) f.classList.toggle("invalid", !!msg); }
}

function validate() {
  let ok = true;
  const fail = (n, m) => { setError(n, m); ok = false; };
  ["name", "phone", "event", "otherEvent", "date", "guests", "dishes"].forEach((n) => setError(n, ""));

  if (!$("name").value.trim()) fail("name", "Enter your name.");
  const digits = $("phone").value.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) fail("phone", "Enter a valid phone number, e.g. 0333 1234567.");
  if (!eventSel.value) fail("event", "Select an event.");
  if (eventSel.value === "Other" && !$("otherEvent").value.trim()) fail("otherEvent", "Enter the event name.");
  if (!$("date").value) fail("date", "Select the event date.");
  else if ($("date").value < $("date").min) fail("date", "Choose today or a future date.");
  const g = parseInt($("guests").value, 10);
  if (!g || g < CONFIG.minGuests) fail("guests", "Enter at least " + CONFIG.minGuests + " guests.");
  if (!chosen.length) fail("dishes", "Add at least one dish.");

  if (!ok) { const first = form.querySelector(".invalid input, .invalid select, .error:not(:empty)"); if (first) first.scrollIntoView({ behavior: "smooth", block: "center" }); }
  return ok;
}

/* ---------- Build message ---------- */
function buildMessage() {
  const ev = eventSel.value === "Other" ? "Other: " + $("otherEvent").value.trim() : eventSel.value;
  const d = new Date($("date").value + "T00:00:00");
  const dateText = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const lines = [
    "New catering request for " + CONFIG.businessName,
    "",
    "Name: " + $("name").value.trim(),
    "Phone: " + $("phone").value.trim(),
    "Event: " + ev,
    "Date: " + dateText,
    "Guests: " + $("guests").value,
    "",
    "Dishes:",
    ...chosen.map((x, i) => (i + 1) + ". " + x)
  ];
  const notes = $("notes").value.trim();
  if (notes) lines.push("", "Venue / requests: " + notes);
  return { text: lines.join("\n"), subject: "Catering request: " + ev + " on " + $("date").value };
}

/* ---------- Send ---------- */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validate()) return;
  const url = "https://wa.me/" + CONFIG.whatsappNumber + "?text=" + encodeURIComponent(buildMessage().text);
  window.open(url, "_blank", "noopener");
});

$("sendEmail").addEventListener("click", () => {
  if (!validate()) return;
  const m = buildMessage();
  window.location.href = "mailto:" + CONFIG.email + "?subject=" + encodeURIComponent(m.subject) + "&body=" + encodeURIComponent(m.text);
});

/* ---------- Footer links ---------- */
$("footWa").href = "https://wa.me/" + CONFIG.whatsappNumber;
// $("footMail").href = "mailto:" + CONFIG.email;
$("footPhone").href = "tel:+" + CONFIG.whatsappNumber;
$("footPhoneText").textContent = CONFIG.phoneDisplay;
// $("footMailText").textContent = CONFIG.email;

buildDishSelect();
renderChosen();
