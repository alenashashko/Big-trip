import TripEventsSortingView from '../view/trip-events-sorting.js';
import TripDaysContainerView from '../view/trip-days-container.js';
import TripDayView from '../view/trip-day.js';
import TripEventEditView from '../view/trip-event-edit.js';
import TripEventView from '../view/trip-event.js';
import NoEventsView from '../view/no-events.js';
import {render, replace} from '../utils/render.js';
import {SortType} from '../const.js';
import {sortEventsByTime, sortEventsByPrice} from '../utils/event.js';

export default class Trip {
  constructor(tripEventsContainer) {
    this._tripEventsContainer = tripEventsContainer;
    this._currentSortType = SortType.DEFAULT;

    this._tripDaysContainerComponent = new TripDaysContainerView();
    this._tripEventsSortingComponent = new TripEventsSortingView();

    this._handleSortTypeChange = this._handleSortTypeChange.bind(this);
  }

  init(tripDays, tripEvents) {
    this.tripDays = tripDays;
    this._tripEvents = tripEvents;
    this._sourcedTripEvents = this._tripEvents; // slice ?
    this._renderTrip();
  }

  _renderNoEvents() {
    this._noEventsComponent = new NoEventsView(); // ?
    render(this._tripEventsContainer, this._noEventsComponent);
  }

  _sortEvents(sortType) {
    switch (sortType) {
      case SortType.TIME:
        this._tripEvents.sort(sortEventsByTime);
        break;
      case SortType.PRICE:
        this._tripEvents.sort(sortEventsByPrice);
        break;
      default:
        this._tripEvents = this._sourcedTripEvents;
    }

    this._currentSortType = sortType;
  }

  _handleSortTypeChange(sortType) {
    if (sortType === this._currentSortType) {
      return;
    }

    this._sortEvents(sortType);
    this._clearEvents();
    // нарисовать только точки
  }

  _renderSorting() {
    render(this._tripEventsContainer, this._tripEventsSortingComponent);
    this._tripEventsSortingComponent.setSortTypeChangeHandler(this._handleSortTypeChange);
  }

  _renderDaysContainer() {
    render(this._tripEventsContainer, this._tripDaysContainerComponent);
  }

  _renderDays() {
    this.tripDays.forEach((day, index) => {
      this._renderDay(day, index);
    });
  }

  _renderDay(day, index) {
    const tripDayComponent = new TripDayView(day);
    render(this._tripDaysContainerComponent, tripDayComponent);
    this._renderEvents(day, index); // render day and events in this day
  }

  _renderEvents(day, index) {
    const tripDayElement = this._tripDaysContainerComponent.getElement()
      .querySelector(`.day:nth-child(${index + 1})`); // ?
    const tripEventList = tripDayElement.querySelector(`.trip-events__list`); // находим список событий в дне?

    day.tripEvents.forEach((tripEvent) => {
      this._renderEvent(tripEventList, tripEvent);
    });
  }

  _clearEvents() {
    this._tripDaysContainerComponent.getElement().innerHTML = ``;
  }

  _renderEvent(container, event) {
    const tripEventComponent = new TripEventView(event);
    let tripEventEditComponent;

    const replaceEventToForm = () => {
      replace(tripEventEditComponent, tripEventComponent);
    };

    const replaceFormToEvent = () => {
      replace(tripEventComponent, tripEventEditComponent);
    };

    const onEscPress = (evt) => {
      if (evt.key === `Escape` || evt.key === `Esc`) {
        replaceFormToEvent();
        document.removeEventListener(`keydown`, onEscPress);
      }
    };

    tripEventComponent.setRollupClickHandler(() => {
      if (!tripEventEditComponent) {
        tripEventEditComponent = new TripEventEditView(event); // create component when click happen
      }
      replaceEventToForm();
      document.addEventListener(`keydown`, onEscPress);

      tripEventEditComponent.setFormSubmitHandler(() => {
        replaceFormToEvent();
      });
    });

    render(container, tripEventComponent);
  }

  _renderTrip() {
    if (this._tripEvents.length === 0) {
      this._renderNoEvents();
      return;
    }

    this._renderSorting();
    this._renderDaysContainer();
    this._renderDays();
  }
}
