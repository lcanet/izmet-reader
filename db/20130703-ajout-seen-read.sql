
alter table article disable trigger trigger_update_article_unread;
alter table article disable trigger trigger_insert_article_unread;

alter table article add column seen boolean not null default false;

alter table feed add column nb_unseen integer not null default 0; 
alter table feed add column nb_read integer not null default 0;
alter table feed drop column nb_unread;

update article set read = false, seen = true;

update feed set nb_read = (select count(1) from article a where a.feed_id = feed.id and a.read = true);
update feed set nb_unseen = (select count(1) from article a where a.feed_id = feed.id and a.seen = false);


alter table article enable trigger trigger_update_article_unread;
alter table article enable trigger trigger_insert_article_unread;



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
			