CREATE TABLE image
(
   id serial, 
   content_type character varying(255), 
   data text, 
   creation_date timestamp without time zone, 
   CONSTRAINT pk_image PRIMARY KEY (id)
) ;

create table feed_backup as select * from feed;

alter table feed add image_id integer;
alter table feed add icon_id integer;


CREATE OR REPLACE FUNCTION update_images()
  RETURNS text AS
$BODY$
DECLARE
	r record;
	insertid integer;
BEGIN
	delete from image;cre
	update feed set image_id = null, icon_id = null;

	FOR r in SELECT id,image from feed where image is not null
	LOOP
		insert into image (content_type, data, creation_date)
		values ('image/png', r.image, now())
		returning id into insertid;
		update feed set image_id = insertid where id = r.id;
	END LOOP;

	FOR r in SELECT id,icon from feed where icon is not null
	LOOP
		insert into image (content_type, data, creation_date)
		values ('image/png', r.icon, now())
		returning id into insertid;
		update feed set icon_id = insertid where id = r.id;
	END LOOP;

	return 'OK';
		
END
$BODY$
 LANGUAGE plpgsql VOLATILE COST 100;
select update_images();
drop function update_images();

alter table feed drop column image;
alter table feed drop column icon;