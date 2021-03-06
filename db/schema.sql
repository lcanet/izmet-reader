CREATE TABLE feed
(
   id serial, 
   type character varying(32), 
   name character varying(256), 
   url character varying(1024), 
   description text, 
   poll_frequency integer NOT NULL DEFAULT 60, 
   last_poll timestamp without time zone,
	image_id integer,
	icon_id integer,
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
  read boolean NOT NULL DEFAULT false,
  starred boolean NOT NULL DEFAULT false,
  CONSTRAINT pk_article PRIMARY KEY (id )
)
WITH (
  OIDS=FALSE
);

CREATE TABLE image
(
   id serial, 
   content_type character varying(255), 
   data text, 
   creation_date timestamp without time zone, 
   CONSTRAINT pk_image PRIMARY KEY (id)
) ;


CREATE LANGUAGE PLPGSQL;


CREATE OR REPLACE FUNCTION update_article_unread() RETURNS TRIGGER AS $eof$
BEGIN
	IF TG_OP = 'INSERT' THEN
		IF NEW.seen = false THEN
			UPDATE feed SET nb_unseen = nb_unseen + 1 WHERE id = new.feed_id;
		END IF;
		RETURN NEW;
	END IF;
	IF TG_OP = 'UPDATE' THEN
		IF OLD.read <> NEW.read AND NEW.read = false THEN
			UPDATE feed SET nb_read = nb_read - 1 WHERE id = new.feed_id;
		END IF;
		IF OLD.read <> NEW.read AND NEW.read = true THEN
			UPDATE feed SET nb_read = nb_read + 1 WHERE id = new.feed_id;
		END IF;
		IF OLD.seen <> NEW.seen AND NEW.seen = false THEN
			UPDATE feed SET nb_unseen = nb_unseen + 1 WHERE id = new.feed_id;
		END IF;
		IF OLD.seen <> NEW.seen AND NEW.seen = true THEN
			UPDATE feed SET nb_unseen = nb_unseen - 1 WHERE id = new.feed_id;
		END IF;
		RETURN NEW;
	END IF;
	IF TG_OP = 'DELETE' THEN
		IF old.read = true THEN
			UPDATE feed SET nb_read = nb_read - 1 WHERE id = old.feed_id;
		END IF;
		return old;
		IF old.seen = false THEN
			UPDATE feed SET nb_unseen = nb_unseen - 1 WHERE id = old.feed_id;
		END IF;
	END IF;
	RETURN NEW;
		
END
$eof$
LANGUAGE plpgsql;
			
CREATE TRIGGER trigger_update_article_unread
    BEFORE UPDATE ON article
    FOR EACH ROW
    EXECUTE PROCEDURE update_article_unread();

CREATE TRIGGER trigger_insert_article_unread
    BEFORE INSERT ON article
    FOR EACH ROW
    EXECUTE PROCEDURE update_article_unread();

CREATE TRIGGER trigger_delete_article_unread
  BEFORE DELETE ON article
  FOR EACH ROW
  EXECUTE PROCEDURE update_article_unread();

create index idx_article_feed_id on article (feed_id);
create index idx_article_feed_id_starred on article (feed_id, starred);


create table feed_stat
(feed_id integer,
articles_day integer,
articles_week integer,
articles_month integer,
articles_quarter integer,
articles_year integer,
articles_stats text,
primary key(feed_id));


    
