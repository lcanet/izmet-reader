CREATE INDEX idx_article_ts ON article USING gin(to_tsvector('english', title || ' ' ||  content));
