// BoardingEase — Weeks 2-3
//
// NOTE FOR WEEK 10-11: everything lives in this one file on purpose.
// Data access, business rules, event handling, and markup generation are
// all mixed together. It works, and it is already annoying to change.
// That annoyance is the reason the Week 10-11 refactor exists. Do not
// tidy this up early -- students need to feel the problem first.

import { listings } from "./data.js";

/* ---------------------------------------------------------------
   1. Element references
   --------------------------------------------------------------- */

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const maxRentInput = document.querySelector("#max-rent");
const resultsList = document.querySelector("#results-list");
const resultCount = document.querySelector("#result-count");
const detailPanel = document.querySelector("#detail-panel");

/* ---------------------------------------------------------------
   2. "State" -- just two module-level variables for now
   --------------------------------------------------------------- */

let visibleListings = listings;
let selectedId = null;
let occupants = 1;
let includeTransport = false;

const SCHOOL_DAYS_PER_MONTH = 22;
const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

// A tiny inline SVG so the demo runs with no image files.
// Week 3 replaces this with real <img> tags, srcset, and loading="lazy".
const placeholder =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">' +
      '<rect width="96" height="96" fill="%23e8f2ee"/>' +
      '<path d="M20 62l18-20 14 16 10-10 14 14v10H20z" fill="%231e7a5f" opacity=".45"/>' +
      '<circle cx="64" cy="32" r="7" fill="%231e7a5f" opacity=".45"/></svg>',
  );

/* ---------------------------------------------------------------
   3. Business rule -- the cost splitter
   In Week 9 this function moves to shared/costCalculator.js and the
   server imports the very same file. Keep it pure: no DOM in here.
   --------------------------------------------------------------- */

function sumUtilities({ electricity = 0, water = 0, internet = 0 }) {
  return electricity + water + internet;
}

function calculateCostPerHead(listing, people, withTransport) {
  const {
    monthlyRent,
    maxOccupants,
    utilitiesIncluded,
    estimatedUtilities,
    fareOneWay,
  } = listing;

  if (!Number.isInteger(people) || people < 1) {
    throw new Error("Number of occupants must be a whole number, at least 1.");
  }
  if (people > maxOccupants) {
    throw new Error(`This listing allows at most ${maxOccupants} occupants.`);
  }

  const rentPerHead = monthlyRent / people;
  const utilitiesPerHead = utilitiesIncluded
    ? 0
    : sumUtilities(estimatedUtilities) / people;
  const transportPerHead = withTransport
    ? fareOneWay * 2 * SCHOOL_DAYS_PER_MONTH
    : 0;

  return {
    rentPerHead,
    utilitiesPerHead,
    transportPerHead,
    totalPerHead: rentPerHead + utilitiesPerHead + transportPerHead,
  };
}

/* ---------------------------------------------------------------
   4. Filtering
   --------------------------------------------------------------- */

function matchesQuery(listing, query) {
  if (!query) return true;
  const haystack = [listing.name, listing.barangay, ...listing.amenities]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function matchesRent(listing, maxRent) {
  if (!maxRent) return true;
  return listing.monthlyRent <= maxRent;
}

function applyFilters(query, maxRent) {
  return listings.filter(
    (listing) => matchesQuery(listing, query) && matchesRent(listing, maxRent),
  );
}

/* ---------------------------------------------------------------
   5. Markup generation
   --------------------------------------------------------------- */

function cardMarkup(listing) {
  const {
    id,
    name,
    barangay,
    monthlyRent,
    maxOccupants,
    utilitiesIncluded,
    distanceToCampusKm,
  } = listing;

  const utilityTag = utilitiesIncluded
    ? '<span class="tag">Utilities included</span>'
    : '<span class="tag tag--utilities">Utilities extra</span>';

  return `
    <li>
      <button class="card" type="button" data-id="${id}" aria-pressed="${id === selectedId}">
        <img class="card__image" src="${placeholder}" alt="" width="96" height="96" loading="lazy">
        <span>
          <span class="card__name">${name}</span>
          <span class="card__meta">
            ${barangay} &middot; ${distanceToCampusKm} km from campus &middot; up to ${maxOccupants}
          </span>
          <span class="card__rent">${peso.format(monthlyRent)} / month</span>
          <span class="tags">${utilityTag}</span>
        </span>
      </button>
    </li>
  `;
}

function renderResults() {
  if (visibleListings.length === 0) {
    resultsList.innerHTML =
      '<li class="empty">No listings match that search. Try a barangay name.</li>';
    resultCount.textContent = "No results";
    return;
  }

  resultsList.innerHTML = visibleListings.map(cardMarkup).join("");
  resultCount.textContent = `${visibleListings.length} listing${visibleListings.length === 1 ? "" : "s"} found`;
}

function breakdownMarkup(listing, cost) {
  const { rentPerHead, utilitiesPerHead, transportPerHead, totalPerHead } =
    cost;

  return `
    <div class="breakdown">
      <p class="breakdown__line"><span>Rent</span><span>${peso.format(rentPerHead)}</span></p>
      <p class="breakdown__line"><span>Utilities</span><span>${peso.format(utilitiesPerHead)}</span></p>
      <p class="breakdown__line"><span>Transport</span><span>${peso.format(transportPerHead)}</span></p>
      <p class="breakdown__total"><span>Per person</span><span>${peso.format(totalPerHead)}</span></p>
    </div>
  `;
}

function renderDetail() {
  if (!selectedId) {
    detailPanel.innerHTML =
      '<p class="detail__empty">Select a listing to see the cost breakdown.</p>';
    return;
  }

  const listing = listings.find((item) => item.id === selectedId);

  let body;
  try {
    body = breakdownMarkup(
      listing,
      calculateCostPerHead(listing, occupants, includeTransport),
    );
  } catch (err) {
    body = `<p class="error">${err.message}</p>`;
  }

  detailPanel.innerHTML = `
    <h2 class="detail__name">${listing.name}</h2>
    <p class="detail__where">${listing.barangay} &middot; ${peso.format(listing.monthlyRent)} / month</p>

    <fieldset class="splitter">
      <legend class="splitter__legend">Split the cost</legend>

      <div class="splitter__row">
        <label for="occupants">Sharing with</label>
        <input class="field__input" type="number" id="occupants"
               min="1" max="${listing.maxOccupants}" value="${occupants}">
      </div>

      <div class="splitter__row">
        <label for="transport">Include daily fare</label>
        <input type="checkbox" id="transport" ${includeTransport ? "checked" : ""}>
      </div>
    </fieldset>

    ${body}
  `;
}

/* ---------------------------------------------------------------
   6. Events
   --------------------------------------------------------------- */

searchForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const maxRent = maxRentInput.value ? Number(maxRentInput.value) : null;
  visibleListings = applyFilters(searchInput.value.trim(), maxRent);
  selectedId = null;
  renderResults();
  renderDetail();
});

searchInput.addEventListener("input", function () {
  const maxRent = maxRentInput.value ? Number(maxRentInput.value) : null;
  visibleListings = applyFilters(searchInput.value.trim(), maxRent);
  renderResults();
});

// One listener on the list instead of one per card -- event delegation.
// Cards are recreated on every render, so listeners attached to them
// would be thrown away each time.
resultsList.addEventListener("click", function (event) {
  const card = event.target.closest(".card");
  if (!card) return;

  selectedId = card.dataset.id;
  occupants = 1;
  renderResults();
  renderDetail();
});

// Same reason: the splitter inputs are recreated whenever the detail
// panel re-renders, so we listen on the panel itself.
detailPanel.addEventListener("input", function (event) {
  if (event.target.id === "occupants") {
    occupants = Number(event.target.value);
    renderDetail();
  }
  if (event.target.id === "transport") {
    includeTransport = event.target.checked;
    renderDetail();
  }
});

/* ---------------------------------------------------------------
   7. Start
   --------------------------------------------------------------- */

renderResults();
renderDetail();
