var timer = function(){

    var start,
        end;

    return {
        start: function(){
            start = new Date().getTime();
        },
        stop: function(){
            end = new Date().getTime();
        },
        getTime: function(){
            return time = end - start;
        }
    };
};

module.exports = timer;
