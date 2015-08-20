/*************************************************************
    Released under the GNU General Public License

    The following copyright announcement is in compliance
    to section 2c of the GNU General Public License, and
    thus can not be removed, or can only be modified
    appropriately.

    Please leave this comment intact together with the
    following copyright announcement.

    Copyright(c) 2014 Allies Computing Ltd

    The authors provide no warranty.

    Auto Complete Version 2.0.0.0
    By Allies Computing Ltd - www.alliescomputing.com

    Requires jQuery, scrollTo
*************************************************************/

;(function ($) {
"use strict";

    var constants = {
      'searchURL': 'https://ws.postcoder.com/pcw/{key}/autocomplete/v2/',
      'finishURL': 'https://ws.postcoder.com/pcw/'
    };

    $.alliesAutoComplete = function(element, options) {

        var defaults = {
            searchkey: '',          // Enter your search key here.
            debug: true,
            addressSelectClass: 'unstyled dropdown-menu',
            addressFinishClass: 'ac-result',
            searchText: 'Enter a postcode, street or address',
            jsonCallback: 'jsonCallback',
            dataset: 'UK'
        }

        var plugin = this;

        var xhr;

        plugin.config = {}

        var $element = $(element), 
             element = element; 

        plugin.init = function() {

            plugin.config = $.extend({}, defaults, options);

            plugin.acAddressSelect = $('<ul class="'+plugin.config.addressSelectClass+'"></ul>');
            plugin.acAddressFinish = $('<div class="'+plugin.config.addressFinishClass+'"></div>');
            plugin.acClear = $('<div class="clearfix"></div>');
            plugin.acInput = $element;

            debug("init();",2);

            plugin.acInput.after(plugin.acAddressSelect).attr('placeholder',plugin.config.searchText).attr('autocomplete','off');
            plugin.acInput.parent().parent().after(plugin.acAddressFinish).after(plugin.acClear);

            plugin.acAddressSelect.on('show',function(){
              if (!plugin.acAddressSelect.is(":visible")){
                plugin.acAddressSelect.show();
              }
            }).on('hide',function(){
              if (plugin.acAddressSelect.is(":visible")){
                plugin.acAddressSelect.hide();
              }
            });

            // attach default change event to search input
            plugin.acInput.on('keyup.alliesAutoComplete focus.alliesAutoComplete',function (evt) {
              search(evt);
            });

            // on click finish item
            plugin.acInput.parent().on('click.alliesAutoComplete','a.finish',function(e){
              e.preventDefault();
              e.stopImmediatePropagation();

              debug('clicked to finish: '+$(this).data('finish-id'));

              if ($(this).data('finish-id') != ''){
                finish($(this).data('finish-id'));
              }else{
                // error 
                debug('Finish ID not found',2);
              }

            });


            var liSelected;
            plugin.acInput.parent().on('keydown.alliesAutoComplete', function(e){

              // which drop down is in use
              var acselect = (plugin.acAddressSelect.is(":visible")) ? plugin.acAddressSelect : plugin.acAddressBrowse ;

              if (e.which === 40){
                // down arrow key
                if (liSelected){
                  liSelected.removeClass('active');

                  var nextLi = liSelected.nextUntil(':visible').add(liSelected).last().next();

                  if(nextLi.length > 0){
                    liSelected = nextLi.addClass('active');

                    acselect.scrollTo(liSelected, { offset:{top:-270} });
                    
                  }else{
                    liSelected = acselect.find('li:visible').first().addClass('active');
                    acselect.scrollTo(liSelected, { offset:{top:-270} });
                  }
                }else{
                  liSelected = acselect.find('li:visible').first().addClass('active');
                  acselect.scrollTo(liSelected, { offset:{top:-270} });
                }
              }else if (e.which === 38){
                // up arrow key
                if (liSelected){
                  liSelected.removeClass('active');

                  nextLi = liSelected.prevUntil(':visible').add(liSelected).first().prev();

                  if(nextLi.length > 0){
                    liSelected = nextLi.addClass('active');
                    acselect.scrollTo(liSelected, { offset:{top:-270} });
                  }else{
                    liSelected = acselect.find('li:visible').last().addClass('active');
                    acselect.scrollTo(liSelected, { offset:{top:-270} });
                  }
                }else{
                  liSelected = acselect.find('li:visible').last().addClass('active');
                  acselect.scrollTo(liSelected, { offset:{top:-270} });
                }
              }else if (e.which === 37){
                // left key press
                if (plugin.acReturnToSearchBtn.is(':visible')){
                  plugin.acReturnToSearchBtn.click();
                }

              }else if (e.which === 13){
                // enter key
                if (liSelected){

                  e.preventDefault();

                  debug('simulate click');

                  liSelected.children('a').click();

                }else{
                  // error ?
                }
              }
            });

            // close when click away
            $(document).on('click.alliesAutoComplete', function(e) {
                if (!($(e.target).parents().is(plugin.acInput.parent()) ) ) {
                  plugin.acAddressSelect.trigger('hide');
                }
            });

        }


        /*
        *   search(evt)
        *
        *   Search the auto complete service
        */
        function search(evt){

          if (evt){
            // don't search if pressing keys to navigate the list
            switch(evt.which){
              case 13:
              case 37:
              case 38:
              case 40:
                evt.preventDefault();
                evt.stopPropagation();
                return false;                
                break;
            }
          }

          var searchstring = plugin.acInput.val();

          if (searchstring == ''){
            return;
          }

          // store the search string
          plugin.acInput.data('search-text',searchstring);

          var dataset = plugin.config.dataset;

          if ($.trim(searchstring) == ''){
            return false;
          }
          
          if(xhr && xhr.readyState != 4){
            xhr.abort();
          }
          xhr = $.ajax({
		  
              url: constants.searchURL.replace('{key}',plugin.config.searchkey)+dataset+'/'+searchstring+'/?format=json',
              type: 'GET',
              dataType: 'jsonp',
              success: function(data){
                
                var addresses = data.predictions;

                if (addresses.length > 0){
                  
                  plugin.acAddressSelect.html('');

                  // check searchstring is still current.
                  if (searchstring === plugin.acInput.val()){
                    
                    // add the addresses to the Select drop down
                    $.each(addresses, function(index, value){
                      var listitem = $('<li></li>');
                      var css = 'finish';
                      var listitemlink = $('<a href="#" class="'+css+'">'+value.prediction+'</a>').data('finish-id',value.refs);

                      plugin.acAddressSelect.append(listitem.append(listitemlink)).trigger('show');

                    });

                  }

                }

              },
              error: function(jqXHR, textStatus, errorThrown ) {
                if (textStatus != 'abort'){
                  debug('Search failed: '+textStatus, 2);
                }
              },
              timeout: 2000
          });
        } // end function search



        /*
        *   finish(id)
        *
        *   Get the full address from the service using the UDPRN 
        */
        function finish(id){

          var searchstring = plugin.acInput.val();

          var url = constants.finishURL + plugin.config.searchkey + '/address/' + plugin.config.dataset + '/' + searchstring + '?udprn='+id+'&lines=4&exclude=organisation,county';

          if(xhr && xhr.readyState != 4){
            xhr.abort();
          }
          xhr = $.ajax({
             type: 'GET',
              url: url,
              async: false,
              jsonpCallback: plugin.config.jsonCallback,
              contentType: "application/json",
              dataType: 'jsonp',
              success: function(result) {

                plugin.acAddressSelect.hide();

                  var addressResult = new Array();
                  addressResult.push(result[0].organisation, result[0].addressline1, result[0].addressline2, result[0].addressline3, result[0].addressline4, result[0].posttown, result[0].county, result[0].postcode);

                   // remove empty lines               
                  var addressArr = addressResult.filter(function(e){return e});

                  plugin.acAddressFinish.html('').html(addressArr.join('<br />')).show();

                  plugin.acInput.val('');

                  // reset the input to search mode.
                  searchMode();

              },
              error: function(e) {
                 plugin.acAddressFinish.html('').html(e.Status);
                 if (plugin.config.searchkey == ''){
                  alert("Error: searchkey missing.\n\nPlease enter your searchkey in jquery.allies.autocomplete.js");
                 }
              }
          });


        } // end function finish




        /*
        *   debug(message, output type <optional>)
        *
        *   Display debug messages
        */
        var debug = function (msg, code) {
          if (plugin.config.debug) {
            switch (code) {
              case 1: // proper error                    
                console.error("AC->" + msg);
                break;
              case 2: // information (writes out objects as strings)
                console.info(msg);
                break;
              case 3: // standard log message
                  console.log("AC->" + msg);
                break;
              default:
                console.info("AC->" + msg);
            }
          }
        };


        var searchMode = function(){
          // go back to search mode

          // keyup now searches result
          plugin.acInput.off('keyup.alliesAutoComplete focus.alliesAutoComplete').on('keyup.alliesAutoComplete focus.alliesAutoComplete',function (evt) {
            search(evt);
          });

          // reset the input
          plugin.acInput.val('').addClass('span10').removeClass('span9').focus().attr('placeholder',plugin.config.searchText);
          
        }

        // fire up the plugin!
        plugin.init();

    }

    // add the plugin to the jQuery.fn object
    $.fn.alliesAutoComplete = function(options) {

        // iterate through the DOM elements we are attaching the plugin to
        return this.each(function() {

            // if plugin has not already been attached to the element
            if (undefined == $(this).data('alliesAutoComplete')) {

                // create a new instance of the plugin
                // pass the DOM element and the user-provided options as arguments
                var plugin = new $.alliesAutoComplete(this, options);

                // in the jQuery version of the element
                // store a reference to the plugin object
                $(this).data('alliesAutoComplete', plugin);

            }

        });

    }


})(jQuery);