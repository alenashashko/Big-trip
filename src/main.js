import SiteMenuView from './view/site-menu.js';
import StatisticsView from './view/statistics.js';
import {RenderPosition, render, remove} from './utils/render.js';
import TripPresenter from './presenter/trip.js';
import InfoPresenter from './presenter/info.js';
import FilterPresenter from './presenter/filter.js';
import DaysModel from './model/days.js';
import OffersModel from './model/offers.js';
import FilterModel from './model/filter.js';
import DestinationsModel from './model/destinations.js';
import {MenuItem, UpdateType, FilterType} from './const.js';
import {groupEventsByDays} from './utils/event.js';
import Api from './api/api.js';
import Store from './api/store.js';
import Provider from './api/provider.js';

const AUTHORIZATION = `Basic qUn7g12Idas131297SA`;
const END_POINT = `https://12.ecmascript.pages.academy/big-trip`;
const STORE_PREFIX = `bigtrip-localstorage`;
const STORE_VER = `v12`;
const STORE_EVENTS = `${STORE_PREFIX}-events-${STORE_VER}`;
const STORE_OFFERS = `${STORE_PREFIX}-offers-${STORE_VER}`;
const STORE_DESTINATIONS = `${STORE_PREFIX}-destinations-${STORE_VER}`;

const headerElement = document.querySelector(`.page-header`);
const headerContainerElement = headerElement.querySelector(`.trip-main`);
const tripControlsContainerElement = headerContainerElement.querySelector(`.trip-controls`);
const siteMenuHeaderElement = tripControlsContainerElement.querySelector(`h2:nth-child(1)`);
const tripEventsFilterHeaderElement = tripControlsContainerElement.querySelector(`h2:nth-child(2)`);
const mainElement = document.querySelector(`main`);
const pageContainerElement = mainElement.querySelector(`.page-body__container`);
export const tripEventsContainerElement = mainElement.querySelector(`.trip-events`);
const newEventButtonElement = document.querySelector(`.trip-main__event-add-btn`);

const api = new Api(END_POINT, AUTHORIZATION);
const storeEvents = new Store(STORE_EVENTS);
const storeOffers = new Store(STORE_OFFERS);
const storeDestinations = new Store(STORE_DESTINATIONS);
const apiWithProvider = new Provider(api, storeEvents, storeOffers, storeDestinations);

const daysModel = new DaysModel();
const offersModel = new OffersModel();
const destinationsModel = new DestinationsModel();
const filterModel = new FilterModel();

export const tripPresenter = new TripPresenter(tripEventsContainerElement, daysModel, filterModel,
    destinationsModel, offersModel, apiWithProvider);
const filterPresenter = new FilterPresenter(tripEventsFilterHeaderElement, filterModel);
const infoPresenter = new InfoPresenter(headerContainerElement, daysModel);

const menuComponent = new SiteMenuView(MenuItem.TABLE);

let statisticsComponent = null;

const handleEventNewFormOpen = () => {
  newEventButtonElement.disabled = false;
};

const handleSiteMenuClick = (menuItem) => {
  switch (menuItem) {
    case MenuItem.TABLE:
      remove(statisticsComponent);

      tripPresenter.init();

      pageContainerElement.classList.add(`page-body__container`);

      break;

    case MenuItem.STATS:
      filterModel.setFilter(UpdateType.MAJOR, FilterType.EVERYTHING);
      tripPresenter.destroy();

      remove(statisticsComponent);
      statisticsComponent = new StatisticsView(daysModel.getAllEvents());

      render(pageContainerElement, statisticsComponent);

      pageContainerElement.classList.remove(`page-body__container`);

      break;
  }
};

const newEventButtonClickHandler = (evt) => {
  evt.target.disabled = true;

  menuComponent.setMenuItem(MenuItem.TABLE);

  remove(statisticsComponent);
  tripPresenter.destroy();

  filterModel.setFilter(UpdateType.MAJOR, FilterType.EVERYTHING);

  if (!pageContainerElement.classList.contains(`page-body__container`)) {
    pageContainerElement.classList.add(`page-body__container`);
  }

  tripPresenter.init();
  tripPresenter.createEvent(handleEventNewFormOpen);
};

menuComponent.setMenuClickHandler(handleSiteMenuClick);
render(siteMenuHeaderElement, menuComponent, RenderPosition.AFTEREND);

infoPresenter.init();
tripPresenter.init();
filterPresenter.init();

newEventButtonElement.addEventListener(`click`, (evt) => {
  newEventButtonClickHandler(evt);
});

Promise.all([apiWithProvider.getEvents(), apiWithProvider.getDestinations(),
  apiWithProvider.getOffers()])
  .then(([events, destinations, offers]) => {
    daysModel.setDays(UpdateType.INIT, groupEventsByDays(events));
    destinationsModel.setDestinations(destinations);
    offersModel.setOffers(offers);
  })
  .catch(() => {
    daysModel.setDays(UpdateType.INIT, []);
  })
  .finally(() => {
    newEventButtonElement.disabled = false;
  });

window.addEventListener(`load`, () => {
  navigator.serviceWorker.register(`/sw.js`)
    .then(() => {
      console.log(`ServiceWorker available`); // eslint-disable-line
    }).catch(() => {
      console.error(`ServiceWorker isn't available`); // eslint-disable-line
    });
});

window.addEventListener(`online`, () => {
  document.title = document.title.replace(` [offline]`, ``);
  apiWithProvider.sync();
});

window.addEventListener(`offline`, () => {
  document.title += ` [offline]`;
});

