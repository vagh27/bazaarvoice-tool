//ellipsis plugin + some hackery
(function($) {
	$.fn.ellipsis = function(){
	    return this.each(function(){
		    var el = $(this),
		    	estQualifyingHeight = $(this).height(); //make sure the review is long enough to warrant ellipsis

		    if(el.css("overflow") == "hidden" && estQualifyingHeight>=80){
		    	el.css('height','80px'); //est review height
		        var text = el.html();
		        var multiline = el.hasClass('multiline');
		        var t = $(this.cloneNode(true))
		                .hide()
		                .css('position', 'absolute')
		                .css('overflow', 'visible')
		                .width(multiline ? el.width() : 'auto')
		                .height(multiline ? 'auto' : el.height());

				el.after(t);

				function height() { return t.height() > el.height(); };
				function width() { return t.width() > el.width(); };

				var func = multiline ? height : width;

				while (text.length > 0 && func())
				{
			        text = text.substr(0, text.length - 1);
			        t.html("<span class='cut'>"+text + "... <span class='more'>Read More</span></span> "); //read more html
				}

				t.append("<span class='full'>"+ el.html() + " <span class='less'>Read Less</span></span> "); //read less html

				el.html(t.html());
				t.remove();
			}
		});
	};
})(jQuery);


//bazaarvoice namespace
var bazaarVoice = {
	callBazaarVoice : function(productID,limit,el){
		$.ajax({
			type: "GET",
			dataType: 'jsonp',
		  	url: "http://samsung.ugc.bazaarvoice.com/data/reviews.json?apiversion=5.4&passkey=ea2uz0kxlbswrvvh6vfp9lfvm&Filter=ProductId:"+productID+"&Include=Products&Stats=Reviews&Limit="+limit,
		  	success: function(data){ bazaarVoice.buildReviews(data,el,productID) },
		  	error: function(e){ window.console && console.log(e); bazaarVoice.noReviews(el); }
		});
	},
	buildReviews : function(data,el,productID){
		if(data.HasErrors != true && data.TotalResults > 0){
			var reviewHTML = "",
				source  = $("#review").html(),
				template = Handlebars.compile(source);

		//handlebar partials
			Handlebars.registerPartial("length", data.Results.length.toString());
			Handlebars.registerPartial("average", data.Includes.Products[productID].ReviewStatistics.AverageOverallRating.toString());

		//handlebar helpers

			//format date
			Handlebars.registerHelper('date', function(options) {
				var date = new Date(options.fn(this)),
					newDate = date.getMonth() + "/" + date.getDate() + "/" + date.getFullYear();
			  	return newDate;
			});

			//determine if review should be hidden
			Handlebars.registerHelper('if', function(conditional,options) {
				if(conditional>2) { return "hideMe"; }
			});

			//render the html
			reviewHTML += template(data);
			$(el).html(reviewHTML);

			//setup show/hide stuff
			$(".ellipsis").ellipsis();
			$('.reviewBlock').on('click','.seeMore',function(){ bazaarVoice.toggleReviews(this); });
			$('.reviewBlock').on('click','.more',function(){ bazaarVoice.toggleReview(this,'auto','.full'); });
			$('.reviewBlock').on('click','.less',function(){ bazaarVoice.toggleReview(this,'80px','.cut'); });

			//now hide the hidden reviews and fade in the block
			$('.hideMe').addClass('hidden');
			$('.reviewBlock').animate({ opacity:1 }, 200, function() { /*we're done*/ });
		}
		else{ window.console && console.log('Errors: ' + data.Errors); bazaarVoice.noReviews(el); }
	},
	noReviews : function(el){ $(el).html("<h1>No Reviews</h1>"); },
	toggleReview : function(el,height,reveal){
		$(el).parent('span').hide();
		$(el).parent().parent('p').children(reveal).show();
		$(el).parent().parent('p').css('height',height);
	},
	toggleReviews : function(el){
		$('.review.hideMe').toggleClass('hidden');
		if ($(el).text()=='See More Reviews') $(el).text("See Less Reviews");
		else $(el).text("See More Reviews");
	}
}
