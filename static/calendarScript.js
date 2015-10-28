// return dd.mm.yyyy string from the database format datetime string
function getDate(datestring) {
	var dayIndex = datestring.indexOf('T')-2;
	var monthIndex = datestring.indexOf('-')+1;
	
	var day = datestring.substring(dayIndex, dayIndex+2);
	var month = datestring.substring(monthIndex, monthIndex+2);
	var year = datestring.substring(0, 4);
	
	return day + '.' + month + '.' + year;
}

// return HH:MM string from the database format datetime string
function getTime(datestring) {
	var index = datestring.indexOf('T')+1;
	var time = datestring.substring(index, index+5);
	
	return time;
}

// for sorting
function compareEvents(a,b){
	
	if (a.begin < b.begin)
		return -1;
	if (a.begin > b.begin)
		return 1;
	return 0;
	
}

function calendarUtil()
{
	
	var events = [];
	
	function sortEvents(){
		events.sort(compareEvents);
	}
	
	// return day divider element with a date specified in the datestring
	function renderDayDivider(datestring){
		
		var html = '<div class="day-divider"><div class="day-label"><span class="text-container">';
		html += datestring;
		html += '</span></div></div>';
		
		return html;
	}
	
	// return html string containing information on current event item. 
	// previousDate contains datestring representation of the begin time of 
	// previous item to find out if a day divider must be printed out or not
	function renderEvent(data, previousDate) {
		
		var html = '';
		
		var currentDate = getDate(data.begin);
		
		if (currentDate != getDate(previousDate)){
			html += '</ul>';
			html += renderDayDivider(currentDate);
			html += '<ul class="event-list">';
		}
		
		html += '<li  class="event">';
		html+='<a href="#" class="event-link" id="'+data._id+'">';
		html+='<div class="time" id="'+data._id+'">'+getTime(data.begin)+'-'+getTime(data.end)+'</div>';
		html+='<div class="event-name" id="'+data._id+'">'+data.name+'</div>';
		html+="</a></li>";
		
		return html;
	}
	
	// renders the calendar
	function renderCalendar() {
		
		var html = '<ul class="event-list">';
				
		var previousDate = '';
		
		// loop throug the events and add them to the html string
		for(var i=0; i<events.length; i++){
			html += renderEvent(events[i], previousDate);
			previousDate = events[i].begin;
		}
		
		html += "</ul>";
		
		// add the html string to the page
		$('.dynamic-content').html(html);
		
	}
	
	function searchEvents() {
		
		var name     = document.getElementById('name-input').value;
		var location = document.getElementById('location-input').value;
		var begin    = document.getElementById('begin-input').value;
		var end      = document.getElementById('end-input').value;
		
		var queryString = "";
		if (name.length)
			queryString += "name="+name;
		if (location.length)
			queryString += "&location="+location;
		if (begin.length)
			queryString += "&begin="+begin;
		if (end.length)
			queryString += "&end="+end;
		
		$.get("/?"+queryString, function(data, status){
			
			if(status=="success"){	
				events=data;
				sortEvents();
				renderCalendar();
			}else{
				//TODO
			}
		});
		
		
	}
	
	// builds the calendar page
	// TODO: print out the events in chronological order
	this.buildCalendar = function() {
		
		$('.page-content').empty();
		// load the calendar template
		$('.page-content').load("calendar_template.html");
		
		if(0) { // if(events.length)
			renderCalendar();
		} else {
			// retrieve the event information
			var now = new Date();
			
			var year = now.getFullYear();
			var month = now.getMonth()+1;
			var day = now.getDate();
			var query = "begin="+year+'-'+month+'-'+day;
			$.get('/?'+query, function(data, status){
				if(status=="success"){
					
					events = data;
					sortEvents();
					renderCalendar();
					
					
				} else {
					// TODO: do something useful
				}
			});
		}
		
		$(document).on('click', "#search-button", function() {
			
			searchEvents();
			
		});
	}
	
	
}


function editEventUtil(cal, eventid) {
	
	var id = eventid;
	
	var name        = "";
	var location    = "";
	var begin       = "";
	var end         = "";
	var description = "";
	
	orig_calendar = cal;
	
	function readValues() {
		
		name        = document.getElementById('name-input').value;
		location    = document.getElementById('location-input').value;
		begin       = document.getElementById('begin-input').value;
		end         = document.getElementById('end-input').value;
		description = document.getElementById('description-input').value;
		
	}
	
	function deleteEvent() {
		
		$.ajax({
			url: '/'+id,
			type: 'DELETE',
			success: function(result) {
				alert(result.message);
				orig_calendar.buildCalendar();
			}
		});
		
	}
	
	function updateEvent() {
		readValues();
		
		$.ajax({
			url: '/'+id,
			type: 'PUT',
			headers: {
				name: name,
				begin: begin,
				end: end,
				location: location,
				description: description
			},
			success: function(result) {
				orig_calendar.buildCalendar();
			}
		});
		
	}
	
	
	// builds the edit event page
	// TODO: pre-fill input fields
	this.buildEditEventPage = function() {
		
		$.get("/"+id, function(data, status){
			
			if(status=="success"){	
				name = data.name;
				location = data.location;
				begin = data.begin;
				end = data.end;
				description = data.description;
				
				$('.page-content').empty();
				
				$('.page-content').load("edit_event_template.html", function(){
					
					$('#name-input').val(name);
					$('#location-input').val(location);
					$('#begin-input').val(begin);
					$('#end-input').val(end);
					$('#description-input').val(description);
				});
				
				
				$(document).off('click', "#cancel-button").on('click', "#cancel-button", function(event) {
					orig_calendar.buildCalendar();
				});
				
				$(document).off('click', "#delete-button").on('click', "#delete-button", function(event) {
					deleteEvent();
				});
				
				$(document).off('click', "#save-button").on('click', "#save-button", function(event) {
					
					updateEvent();
				});
				
				
			}else{
				//TODO
			}
		});
		
		
		
		
		
	}
	
}

function createEventUtil(cal) {
	
	var name        = "";
	var location    = "";
	var begin       = "";
	var end         = "";
	var description = "";
	var orig_calendar = cal;
	
	function readValues() {
		
		name        = document.getElementById('name-input').value;
		location    = document.getElementById('location-input').value;
		begin       = document.getElementById('begin-input').value;
		end         = document.getElementById('end-input').value;
		description = document.getElementById('description-input').value;
		
	}
	
	function createEvent() {
		
		$.ajax({
			url: '/',
			type: 'post',
			headers: {
				name: name,
				begin: begin,
				end: end,
				location: location,
				description: description
			},
			dataType: 'json',
			success: function (data) {
				alert(data.message);
				orig_calendar.buildCalendar();
			}
		});
		
	}
	
	// builds the create event page
	this.buildCreateEventPage = function() {
		$('.page-content').empty();
		$('.page-content').load("new_event_template.html");
		
		$(document).off('click', "#create-event-button").on('click', "#create-event-button", function(event) {
			readValues();
			createEvent();
		});
		
		$(document).off('click', "#cancel-button").on('click', "#cancel-button", function(event) {
			orig_calendar.buildCalendar();
		});
		
		$(document).off('click', "#toggle-query-button").on('click', "#toggle-query-button", function(event) {
			$("#query-form").slideToggle(200);
		});
		
	}
	
}

function calendarBegin() {
	
	var calendar = new calendarUtil();
	
	calendar.buildCalendar();
	
	
	$(document).off('click', "#new-event-button").on('click', "#new-event-button", function(event) {
		
		
		var new_event = new createEventUtil(calendar);
		
		new_event.buildCreateEventPage();
	});
	
	$(document).off('click', ".event-link").on('click', ".event-link", function(event) {
		var eventpage = new editEventUtil(calendar, event.target.id);
		eventpage.buildEditEventPage();
	});
	
}




$(document).ready(function(){
	
	calendarBegin();
	
});
