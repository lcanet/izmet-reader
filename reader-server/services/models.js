exports.models = {
    "Feed":{
        "id":"Feed",
        "properties":{
            "id":{
                "type":"long"
            },
            "name":{
                "type":"string"
            },
            "type":{
                "type":"string"
            },
            "url":{
                "type":"string"
            },
            "description":{
                "type":"string"
            },
            "poll_frequency":{
                "type":"long"
            },
            "nb_unread":{
                "type":"int",
                "description": "Number of unread articles in feed"
            }
        }
    },

    "Article": {
        "id": "Article",
        "properties": {
            "id": {
                "type": "long"
            },
            "fetch_date": {
                "type": "long",
                "description": "Fetch date of this article"
            },
            "article_date": {
                "type": "long",
                "description": "date of this article"
            },
            "title": {
                "type:": "string"
            },
            "content": {
                "type": "string"
            },
            "url": {
                "type": "string"
            },
            "read": {
                "type": "boolean"
            },
            "article_id": {
                "type": "string"
            }
        }
    },
    "ArticleWithFeed": {
        "id": "ArticleWithFeed",
        "properties": {
            "id": {
                "type": "long"
            },
            "fetch_date": {
                "type": "long",
                "description": "Fetch date of this article"
            },
            "article_date": {
                "type": "long",
                "description": "date of this article"
            },
            "title": {
                "type:": "string"
            },
            "content": {
                "type": "string"
            },
            "url": {
                "type": "string"
            },
            "read": {
                "type": "boolean"
            },
            "article_id": {
                "type": "string"
            },
            "feed": {
                "type": "Feed"
            }

        }
    },

    "ArticleState": {
        "id": "ArticleState",
        "properties": {
            "id": {
                "type": "long"
            },
            "read": {
                "type": "boolean"
            }
        }

    }


};