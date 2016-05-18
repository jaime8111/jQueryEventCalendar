/* =
    jquery.eventCalendar.js
    version: 0.7
    date: 13-08-2015
    author:
        Jaime Fernandez (@vissit)
    company:
        Paradigma Tecnologico (@paradigmate)
    url:
   		http://www.vissit.com/projects/eventCalendar/
*/
;(function( $ ) {
	$.fn.eventCalendar = function(options){
		var calendar = this;

		if ( options.locales && typeof(options.locales) == 'string' ) {
			$.getJSON(options.locales, function(data) {
				options.locales = $.extend({}, $.fn.eventCalendar.defaults.locales, data);
				moment.locale(data.locale, options.locales.moment);
				moment.locale(data.locale);

				initEventCalendar(calendar, options);
			}).error(function() {
				showError("error getting locale json", $(this));
			});
		} else {
			if ( options.locales && options.locales.locale ) {
				options.locales = $.extend({}, $.fn.eventCalendar.defaults.locales, options.locales);
				moment.locale(options.locales.locale, options.locales.moment);
				moment.locale(options.locales.locale);
			}
			initEventCalendar(calendar, options);
		}


	};


	// define the parameters with the default values of the function
	$.fn.eventCalendar.defaults = {
	    eventsjson: 'js/events.json',
		eventsLimit: 4,
		locales: {
			locale: "en",
			txt_noEvents: "There are no events in this period",
			txt_SpecificEvents_prev: "",
			txt_SpecificEvents_after: "events:",
			txt_next: "next",
			txt_prev: "prev",
			txt_NextEvents: "Next events:",
			txt_GoToEventUrl: "See the event",
			txt_loading: "loading..."
		},
		showDayAsWeeks: true,
		startWeekOnMonday: true,
		showDayNameInCalendar: true,
		showDescription: false,
		onlyOneDescription: true,
		openEventInNewWindow: false,
		eventsScrollable: false,
		dateFormat: "D/MM/YYYY",
		jsonDateFormat: 'timestamp', // you can use also "human" 'YYYY-MM-DD HH:MM:SS'
		moveSpeed: 500,	// speed of month move when you clic on a new date
		moveOpacity: 0.15, // month and events fadeOut to this opacity
		jsonData: "", 	// to load and inline json (not ajax calls)
		cacheJson: true	// if true plugin get a json only first time and after plugin filter events
						// if false plugin get a new json on each date change
	};

	function initEventCalendar(that, options) {
		var eventsOpts = $.extend({}, $.fn.eventCalendar.defaults, options);

		// define global vars for the function
		var flags = {
			wrap: "",
			directionLeftMove: "300",
			eventsJson: {}
		};

		// each eventCalendar will execute this function
		that.each(function(){

			flags.wrap = $(this);
			flags.wrap.addClass('eventCalendar-wrap').append("<div class='eventCalendar-list-wrap'><p class='eventCalendar-subtitle'></p><span class='eventCalendar-loading'>"+eventsOpts.locales.txt_loading+"</span><div class='eventCalendar-list-content'><ul class='eventCalendar-list'></ul></div></div>");

			if (eventsOpts.eventsScrollable) {
				flags.wrap.find('.eventCalendar-list-content').addClass('scrollable');
			}

			setCalendarWidth(flags);
			$(window).resize(function(){
				setCalendarWidth(flags);
			});
			//flags.directionLeftMove = flags.wrap.width();

			// show current month
			dateSlider("current", flags, eventsOpts);

			getEvents(flags, eventsOpts, eventsOpts.eventsLimit,false,false,false,false);

			changeMonth(flags, eventsOpts);

			flags.wrap.on('click','.eventCalendar-day a',function(e){
			//flags.wrap.find('.eventCalendar-day a').live('click',function(e){
				e.preventDefault();
				var year = flags.wrap.attr('data-current-year'),
					month = flags.wrap.attr('data-current-month'),
					day = $(this).parent().attr('rel');

				getEvents(flags, eventsOpts, false, year, month,day, "day");
			});
			flags.wrap.on('click','.eventCalendar-monthTitle', function(e){
			//flags.wrap.find('.eventCalendar-monthTitle').live('click',function(e){
				e.preventDefault();
				var year = flags.wrap.attr('data-current-year'),
					month = flags.wrap.attr('data-current-month');

				getEvents(flags, eventsOpts, eventsOpts.eventsLimit, year, month,false, "month");
			});
		});

		// show event description
		flags.wrap.find('.eventCalendar-list').on('click','.eventCalendar-eventTitle',function(e){
		//flags.wrap.find('.eventCalendar-list .eventCalendar-eventTitle').live('click',function(e){
			if(!eventsOpts.showDescription) {
				e.preventDefault();
				var desc = $(this).parent().find('.eventCalendar-eventDesc');

				if (!desc.find('a').size()) {
					var eventUrl = $(this).attr('href');
					var eventTarget = $(this).attr('target');

					// create a button to go to event url
					desc.append('<a href="' + eventUrl + '" target="'+eventTarget+'" class="bt">'+eventsOpts.locales.txt_GoToEventUrl+'</a>');
				}

				if ( desc.is(':visible') ) {
					desc.slideUp();
				} else {
					if(eventsOpts.onlyOneDescription) {
						flags.wrap.find('.eventCalendar-eventDesc').slideUp();
					}
					desc.slideDown();
				}

			}
		});
	}

	function sortJson(a, b){
		if ( typeof a.date === 'string' ) {
			return a.date.toLowerCase() > b.date.toLowerCase() ? 1 : -1;
		}
		return a.date > b.date ? 1 : -1;
	}

	function dateSlider(show, flags, eventsOpts) {
		var $eventsCalendarSlider = $("<div class='eventCalendar-slider'></div>"),
			$eventsCalendarMonthWrap = $("<div class='eventCalendar-monthWrap'></div>"),
			$eventsCalendarTitle = $("<div class='eventCalendar-currentTitle'><a href='#' class='eventCalendar-monthTitle'></a></div>"),
			$eventsCalendarArrows = $("<a href='#' class='eventCalendar-arrow eventCalendar-prev'><span>" + eventsOpts.locales.txt_prev + "</span></a><a href='#' class='eventCalendar-arrow eventCalendar-next'><span>" + eventsOpts.locales.txt_next + "</span></a>");
			$eventsCalendarDaysList = $("<ul class='eventCalendar-daysList'></ul>"),
			date = new Date();

		if ( !flags.wrap.find('.eventCalendar-slider').length ) {
			flags.wrap.prepend($eventsCalendarSlider);
			$eventsCalendarSlider.append($eventsCalendarMonthWrap);
		} else {
			flags.wrap.find('.eventCalendar-slider').append($eventsCalendarMonthWrap);
		}

		flags.wrap.find('.eventCalendar-monthWrap.eventCalendar-currentMonth').removeClass('eventCalendar-currentMonth').addClass('eventCalendar-oldMonth');
		$eventsCalendarMonthWrap.addClass('eventCalendar-currentMonth').append($eventsCalendarTitle, $eventsCalendarDaysList);



		// if current show current month & day
		if (show === "current") {
			day = date.getDate();
			$eventsCalendarSlider.append($eventsCalendarArrows);

		} else {
			date = new Date(flags.wrap.attr('data-current-year'),flags.wrap.attr('data-current-month'),1,0,0,0); // current visible month
			day = 0; // not show current day in days list

			moveOfMonth = 1;
			if (show === "prev") {
				moveOfMonth = -1;
			}
			date.setMonth( date.getMonth() + moveOfMonth );

			var tmpDate = new Date();
			if (date.getMonth() === tmpDate.getMonth()) {
				day = tmpDate.getDate();
			}

		}

		// get date portions
		var year = date.getFullYear(), // year of the events
			currentYear = new Date().getFullYear(), // current year
			month = date.getMonth(), // 0-11
			monthToShow = month + 1;

		if (show != "current") {
			// month change
			getEvents(flags, eventsOpts, eventsOpts.eventsLimit, year, month,false, show);
		}

		flags.wrap.attr('data-current-month',month)
			.attr('data-current-year',year);

		// add current date info
		moment.locale(eventsOpts.locales.locale);

		var formatedDate = moment(year+" "+monthToShow, "YYYY MM").format("MMMM YYYY");
		$eventsCalendarTitle.find('.eventCalendar-monthTitle').html(formatedDate);

		// print all month days
		var daysOnTheMonth = 32 - new Date(year, month, 32).getDate();
		var daysList = [],
			i;
		if (eventsOpts.showDayAsWeeks) {
			$eventsCalendarDaysList.addClass('eventCalendar-showAsWeek');

			// show day name in top of calendar
			if (eventsOpts.showDayNameInCalendar) {
				$eventsCalendarDaysList.addClass('eventCalendar-showDayNames');

				i = 0;
				// if week start on monday
				if (eventsOpts.startWeekOnMonday) {
					i = 1;
				}

				for (; i < 7; i++) {
					daysList.push('<li class="eventCalendar-day-header">'+moment()._locale._weekdaysShort[i]+'</li>');

					if (i === 6 && eventsOpts.startWeekOnMonday) {
						// print sunday header
						daysList.push('<li class="eventCalendar-day-header">'+moment()._locale._weekdaysShort[0]+'</li>');
					}

				}
			}

			dt=new Date(year, month, 01);
			var weekDay = dt.getDay(); // day of the week where month starts

			if (eventsOpts.startWeekOnMonday) {
				weekDay = dt.getDay() - 1;
			}
			if (weekDay < 0) { weekDay = 6; } // if -1 is because day starts on sunday(0) and week starts on monday

			for (i = weekDay; i > 0; i--) {
				daysList.push('<li class="eventCalendar-day eventCalendar-empty"></li>');
			}
		}
		for (dayCount = 1; dayCount <= daysOnTheMonth; dayCount++) {
			var dayClass = "";

			if (day > 0 && dayCount === day && year === currentYear) {
				dayClass = "today";
			}
			daysList.push('<li id="dayList_' + dayCount + '" rel="'+dayCount+'" class="eventCalendar-day '+dayClass+'"><a href="#">' + dayCount + '</a></li>');
		}
		$eventsCalendarDaysList.append(daysList.join(''));

		$eventsCalendarSlider.css('height',$eventsCalendarMonthWrap.height()+'px');
	}

	function getEvents(flags, eventsOpts, limit, year, month, day, direction) {
		limit = limit || 0;
		year = year || '';
		day = day || '';

		// to avoid problem with january (month = 0)

		if (typeof month != 'undefined') {
			month = month;
		} else {
			month = '';
		}

		//var month = month || '';
		flags.wrap.find('.eventCalendar-loading').fadeIn();

		if (eventsOpts.jsonData) {
			// user send a json in the plugin params
			eventsOpts.cacheJson = true;

			flags.eventsJson = eventsOpts.jsonData;
			getEventsData(flags, eventsOpts, flags.eventsJson, limit, year, month, day, direction);

		} else if (!eventsOpts.cacheJson || !direction) {
			// first load: load json and save it to future filters
			$.getJSON(eventsOpts.eventsjson + "?limit="+limit+"&year="+year+"&month="+month+"&day="+day, function(data) {
				flags.eventsJson = data; // save data to future filters
				getEventsData(flags, eventsOpts, flags.eventsJson, limit, year, month, day, direction);
			}).error(function() {
				showError("error getting json: ", flags.wrap);
			});
		} else {
			// filter previus saved json
			getEventsData(flags, eventsOpts, flags.eventsJson, limit, year, month, day, direction);
		}

		if (day > '') {
			flags.wrap.find('.eventCalendar-current').removeClass('eventCalendar-current');
			flags.wrap.find('#dayList_'+day).addClass('eventCalendar-current');
		}
	}

	function getEventsData(flags, eventsOpts, data, limit, year, month, day, direction){
		directionLeftMove = "-=" + flags.directionLeftMove;
		eventContentHeight = "auto";

		subtitle = flags.wrap.find('.eventCalendar-list-wrap .eventCalendar-subtitle');

		if ( !direction ) {
			// first load
			subtitle.html(eventsOpts.locales.txt_NextEvents);
			eventContentHeight = "auto";
			directionLeftMove = "-=0";
		} else {
			var jsMonth = parseInt(month) + 1,
				formatedDate;
			moment.locale(eventsOpts.locales.locale);

			if (day !== '') {
				formatedDate = moment(year+" "+jsMonth+" "+day, "YYYY MM DD").format("LL");
				subtitle.html(eventsOpts.locales.txt_SpecificEvents_prev + formatedDate + " " + eventsOpts.locales.txt_SpecificEvents_after);
				//eventStringDate = moment(eventDate).format(eventsOpts.dateFormat);
			} else {
				formatedDate = moment(year+" "+jsMonth, "YYYY MM").format("MMMM");
				subtitle.html(eventsOpts.locales.txt_SpecificEvents_prev + formatedDate + " " + eventsOpts.locales.txt_SpecificEvents_after);
			}

			if (direction === 'eventCalendar-prev') {
				directionLeftMove = "+=" + flags.directionLeftMove;
			} else if (direction === 'day' || direction === 'month') {
				directionLeftMove = "+=0";
				eventContentHeight = 0;
			}
		}

		flags.wrap.find('.eventCalendar-list').animate({
			opacity: eventsOpts.moveOpacity,
			left: directionLeftMove,
			height: eventContentHeight
		}, eventsOpts.moveSpeed, function() {
			flags.wrap.find('.eventCalendar-list').css({'left':0, 'height': 'auto'}).hide();
			//wrap.find('.eventCalendar-list li').fadeIn();

			var events = [];

			data = $(data).sort(sortJson); // sort event by dates
			// each event
			if ( data.length ) {

				// show or hide event description
				var eventDescClass = '';
				if(!eventsOpts.showDescription) {
					eventDescClass = 'eventCalendar-hidden';
				}
				var eventLinkTarget = "_self";
				if(eventsOpts.openEventInNewWindow) {
					eventLinkTarget = '_blank';
				}

				var i = 0;
				$.each(data, function(key, event) {
					var eventDateTime, eventDate, eventTime, eventYear, eventMonth, eventDay,
						eventMonthToShow, eventHour, eventMinute, eventSeconds;
					if (eventsOpts.jsonDateFormat == 'human') {
						eventDateTime = event.date.split(" ");
						eventDate = eventDateTime[0].split("-");
						eventTime = eventDateTime[1].split(":");
						eventYear = eventDate[0];
						eventMonth = parseInt(eventDate[1]) - 1;
						eventDay = parseInt(eventDate[2]);
						//eventMonthToShow = eventMonth;
						eventMonthToShow = parseInt(eventMonth) + 1;
						eventHour = eventTime[0];
						eventMinute = eventTime[1];
						eventSeconds = eventTime[2];
						eventDate = new Date(eventYear, eventMonth, eventDay, eventHour, eventMinute, eventSeconds);
					} else {
						eventDate = new Date(parseInt(event.date));
						eventYear = eventDate.getFullYear();
						eventMonth = eventDate.getMonth();
						eventDay = eventDate.getDate();
						eventMonthToShow = eventMonth + 1;
						eventHour = eventDate.getHours();
						eventMinute = eventDate.getMinutes();

					}

					if (parseInt(eventMinute) <= 9) {
						eventMinute = "0" + parseInt(eventMinute);
					}


					if (limit === 0 || limit > i) {
						// if month or day exist then only show matched events

						if ((month === false || month == eventMonth) && (day === '' || day == eventDay) && (year === '' || year == eventYear) ) {
								// if initial load then load only future events
								if (month === false && eventDate < new Date()) {
								} else {
									moment.locale(eventsOpts.locales.locale);
									//eventStringDate = eventDay + "/" + eventMonthToShow + "/" + eventYear;
									eventStringDate = moment(eventDate).format(eventsOpts.dateFormat);
									var eventTitle;

									if (event.url) {
										eventTitle = '<a href="'+event.url+'" target="' + eventLinkTarget + '" class="eventCalendar-eventTitle">' + event.title + '</a>';
									} else {
										eventTitle = '<span class="eventCalendar-eventTitle">'+event.title+'</span>';
									}
									events.push('<li id="' + key + '" class="'+event.type+'"><time datetime="'+eventDate+'"><em>' + eventStringDate + '</em><small>'+eventHour+":"+eventMinute+'</small></time>'+eventTitle+'<p class="eventCalendar-eventDesc ' + eventDescClass + '">' + event.description + '</p></li>');
									i++;
								}
						}
					}

					// add mark in the dayList to the days with events
					if (eventYear == flags.wrap.attr('data-current-year') && eventMonth == flags.wrap.attr('data-current-month')) {
						flags.wrap.find('.eventCalendar-currentMonth .eventCalendar-daysList #dayList_' + parseInt(eventDay)).addClass('eventCalendar-dayWithEvents');
					}

				});
			}

			// there is no events on this period
			if (!events.length) {
				events.push('<li class="eventCalendar-noEvents"><p>' + eventsOpts.locales.txt_noEvents + '</p></li>');
			}
			flags.wrap.find('.eventCalendar-loading').hide();

			flags.wrap.find('.eventCalendar-list')
				.html(events.join(''));

			flags.wrap.find('.eventCalendar-list').animate({
				opacity: 1,
				height: "toggle"
			}, eventsOpts.moveSpeed);


		});
		setCalendarWidth(flags);
	}

	function changeMonth(flags, eventsOpts) {
		flags.wrap.find('.eventCalendar-arrow').click(function(e){
			e.preventDefault();
			var lastMonthMove;

			if ($(this).hasClass('eventCalendar-next')) {
				dateSlider("next", flags, eventsOpts);
				lastMonthMove = '-=' + flags.directionLeftMove;

			} else {
				dateSlider("prev", flags, eventsOpts);
				lastMonthMove = '+=' + flags.directionLeftMove;
			}

			flags.wrap.find('.eventCalendar-monthWrap.eventCalendar-oldMonth').animate({
				opacity: eventsOpts.moveOpacity,
				left: lastMonthMove
			}, eventsOpts.moveSpeed, function() {
				flags.wrap.find('.eventCalendar-monthWrap.eventCalendar-oldMonth').remove();
			});
		});
	}

	function showError(msg, wrap) {
		wrap.find('.eventCalendar-list-wrap').html("<span class='eventCalendar-loading eventCalendar-error'>"+msg+"</span>");
	}

	function setCalendarWidth(flags){
		// resize calendar width on window resize
		flags.directionLeftMove = flags.wrap.width();
		flags.wrap.find('.eventCalendar-monthWrap').width(flags.wrap.width() + 'px');

		flags.wrap.find('.eventCalendar-list-wrap').width(flags.wrap.width() + 'px');

	}


})( jQuery );
