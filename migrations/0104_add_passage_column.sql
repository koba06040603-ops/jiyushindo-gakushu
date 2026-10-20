-- 国語の読解カード用: 本文（passage）を保持する列を追加する。
-- 国語は「本文が無いと解けない」ため、問題文とは別に本文を保存する必要がある。
-- 例題側の本文も同様に保持する。
-- 既存行は NULL（算数など本文不要の教科はそのまま NULL で運用する）。

ALTER TABLE learning_cards ADD COLUMN passage TEXT;
ALTER TABLE learning_cards ADD COLUMN example_passage TEXT;
