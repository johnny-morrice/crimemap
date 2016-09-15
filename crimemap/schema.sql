drop table if exists countries;
create table countries (
	id integer primary key autoincrement,
	code text not null
);

drop table if exists years;
create table years (
	year integer primary key
);

drop table if exists crimes;
create table crimes (
	id integer primary key autoincrement,
	reportcount integer not null,
	location integer not null,
	yeardate integer not null,
	foreign key(location) references countries(id),
	foreign key(yeardate) references years(year)
);
