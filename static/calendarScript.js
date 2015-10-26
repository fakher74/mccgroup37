

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


function calendarUtil()
{
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
		
		if (currentDate != previousDate){
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
	
	// builds the calendar page
	// TODO: print out the events in chronological order
	this.buildCalendar = function() {
		
		// load the calendar template
		$('.page-content').load("calendar_template.html");
		
		// retrieve the event information
		$.get("/", function(data, status){
			
			if(status=="success"){
				
				var html = '<ul class="event-list">';
				
				var previousDate = '';
				
				// loop throug the events and add them to the html string
				for(var i=0; i<data.length; i++){
					html += renderEvent(data[i], previousDate);
					previousDate = data[i].begin;
				}
				
				html += "</ul>";
				
				// add the html string to the page
				$('.dynamic-content').html(html);
				
			} else {
				// TODO: do something useful
			}
		});
	}
	
	
}


function editEventUtil() {
	
	this.id = "";
	
	
	// This is a useless function
	this.getEventDetails = function(id) {
		$.get("/"+id, function(data, status){
			if(status=="success"){
				return data;
			} else {
				// TODO: do something useful
			}
		});
	}
	
	// builds the edit event page
	// TODO: pre-fill input fields
	this.buildEditEventPage = function(id) {
		$('.page-content').load("edit_event_template.html");
		
		//var eventDetails = getEventDetails(id);
		
	}
	
}

// builds the create event page
function buildCreateEventPage() {
	$('.page-content').load("new_event_template.html");
	
	$(document).on('click', "#cancel-button", function(event) {
		calendarBegin();
	});
}

function calendarBegin() {
	
	var calendar = new calendarUtil();
	calendar.buildCalendar();
	
	
	$(document).on('click', "#new-event-button", function(event) {
		buildCreateEventPage();
	});
	
	$(document).on('click', ".event-link", function(event) {
		var eventpage = new editEventUtil();
		eventpage.buildEditEventPage();
	});
	
}




$(document).ready(function(){
	
	calendarBegin();
	
});
