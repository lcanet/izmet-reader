CREATE TABLE feed
(
   id serial, 
   type character varying(32), 
   name character varying(256), 
   url character varying(1024), 
   description text, 
   poll_frequency integer NOT NULL DEFAULT 60, 
   last_poll timestamp without time zone, 
   CONSTRAINT pk_feed PRIMARY KEY (id)
) 
WITH (
  OIDS = FALSE
)
;
CREATE TABLE article
(
  id serial NOT NULL,
  feed_id integer,
  date timestamp without time zone,
  title character varying(256),
  content text,
  url character varying(1024),
  read boolean DEFAULT false,
  CONSTRAINT pk_article PRIMARY KEY (id )
)
WITH (
  OIDS=FALSE
);
