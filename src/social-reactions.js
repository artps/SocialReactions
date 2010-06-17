Function.prototype.bind = function(ctx) {
    var self = this;
    return function(){
        return self.apply(ctx, arguments);
    }
};

var Utils = {
    queryString: function(hash){
        var outlist = [];
        for(var k in hash){
            outlist.push(k + '=' + hash[k]);
        }
        return '?' + outlist.join('&');
    },
    each: function(list, fn, obj){
        for(var i=0; i < list.length; ++i){
            fn.apply(obj, [list[i]]);
        }
    }
};

var Wrapper = {};

Wrapper.jQuery = function(){
    return this;
};
Wrapper.jQuery.prototype = {
    request: function(options){
        $.getJSON(
            options.url + Utils.queryString(options.data) + '&callback=?',
            options.oncomplete
        );
    }
};

Wrapper.Mootools = function(){
    return this;
};
Wrapper.Mootools.prototype = {
    request: function(options){
        new Request.JSONP({
            url: options.url,
            data: options.data,
            onComplete: options.oncomplete
        }).send()
    }
};

var Service = {};

Service.Twitter = function(url){
    return this.init(url);
};
Service.Twitter.prototype = {
    name: 'Twitter',
    apiurl: 'http://backtweets.com/search.json',
    options: {},

    init: function(url){
        this.url = url;
    },

    get data(){
        return {
            q: this.url,
            key: '7673bf05dbfab4158afe'
        }
    },

    parseResponse: function(data){
        return data;
    }
};

Service.FriendFeed = function(url){
    return this.init(url);
};
Service.FriendFeed.prototype = {
    name: 'FriendFeed',
    apiurl: 'http://friendfeed-api.com/v2/url',

    init: function(url){
        this.url = url;
    },

    get data(){
        return {
            url: this.url
        }
    },

    parseResponse: function(data){
        return data;
    }
};

var Reactions = function(options){
    return this.init(options);
};

Reactions.prototype = {
    events: {},
    services: [],

    init: function(options) {
        if(options.wrapper == undefined ||
           options.services == undefined ){
            return;
        }

        this.wrapper = new options.wrapper();

        Utils.each(options.services, function(service){
            this.services.push(
                new service(options.url)
            );
        }, this);

        return this;
    },

    fetch: function() {
        Utils.each(this.services, function(service){
            var oncomplete = function(data) {
                this.fire('complete', [
                    service.parseResponse(data),
                    service.name
                ]);
            }.bind(this);
            this.wrapper.request({
                url: service.apiurl,
                data: service.data,
                oncomplete: oncomplete
            });
        }, this);
    },

    bind: function(name, fn){
        this.events[name] = fn;
    },

    fire: function(name, args){
        this.events[name].apply(this, args);
    }
};

