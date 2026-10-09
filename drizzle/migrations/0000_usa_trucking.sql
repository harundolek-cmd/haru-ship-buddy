CREATE TABLE public.trucks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_no text NOT NULL,
  equipment_type text NOT NULL DEFAULT 'Flatbed',
  axles integer,
  make text,
  model_year integer,
  vin text,
  plate text,
  plate_state text,
  deck_length_ft numeric,
  max_weight_lbs integer,
  status text NOT NULL DEFAULT 'active',
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trucks TO authenticated;
GRANT ALL ON public.trucks TO service_role;
ALTER TABLE public.trucks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read" ON public.trucks FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert" ON public.trucks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update" ON public.trucks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin delete" ON public.trucks FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

ALTER TABLE public.drivers
  ADD COLUMN cdl_class text DEFAULT 'A',
  ADD COLUMN home_base text,
  ADD COLUMN current_city text,
  ADD COLUMN lat double precision,
  ADD COLUMN lng double precision,
  ADD COLUMN location_updated_at timestamptz;

ALTER TABLE public.loads
  ADD COLUMN broker text,
  ADD COLUMN broker_mc text,
  ADD COLUMN reference_no text,
  ADD COLUMN shipper text,
  ADD COLUMN consignee text,
  ADD COLUMN delivery_date date,
  ADD COLUMN commodity text,
  ADD COLUMN weight_lbs integer,
  ADD COLUMN length_ft numeric,
  ADD COLUMN width_ft numeric,
  ADD COLUMN height_ft numeric,
  ADD COLUMN pieces integer,
  ADD COLUMN equipment_type text,
  ADD COLUMN truck_id uuid REFERENCES public.trucks(id) ON DELETE SET NULL,
  ADD COLUMN miles integer,
  ADD COLUMN oversize boolean NOT NULL DEFAULT false,
  ADD COLUMN permits text,
  ADD COLUMN detention numeric,
  ADD COLUMN lumper numeric;

-- Demo: driver locations across the US
WITH d AS (SELECT id, row_number() OVER (ORDER BY created_at, id) rn FROM public.drivers),
c(rn, city, lat, lng) AS (VALUES
 (1,'Dallas, TX',32.7767,-96.7970),(2,'Atlanta, GA',33.7490,-84.3880),(3,'Chicago, IL',41.8781,-87.6298),
 (4,'Phoenix, AZ',33.4484,-112.0740),(5,'Houston, TX',29.7604,-95.3698),(6,'Denver, CO',39.7392,-104.9903),
 (7,'Nashville, TN',36.1627,-86.7816),(8,'Kansas City, MO',39.0997,-94.5786),(9,'Columbus, OH',39.9612,-82.9988))
UPDATE public.drivers dr SET current_city=c.city, home_base=c.city, lat=c.lat, lng=c.lng, location_updated_at=now()
FROM d JOIN c ON c.rn = ((d.rn-1) % 9)+1 WHERE dr.id=d.id;

INSERT INTO public.trucks (unit_no, equipment_type, axles, make, model_year, plate, plate_state, deck_length_ft, max_weight_lbs, status) VALUES
 ('HT-101','RGN',8,'Peterbilt 389',2022,'TX4R81','TX',29,150000,'active'),
 ('HT-102','RGN',7,'Kenworth W900',2021,'TX7K22','TX',29,120000,'active'),
 ('HT-103','Double Drop',5,'Freightliner Cascadia',2023,'GA2D19','GA',29,48000,'active'),
 ('HT-104','Flatbed',5,'Volvo VNL 860',2023,'IL9F04','IL',48,48000,'active'),
 ('HT-105','Step Deck',5,'International LT',2022,'AZ3S55','AZ',48,48000,'active'),
 ('HT-106','Lowboy',9,'Mack Anthem',2021,'CO1L77','CO',26,160000,'shop'),
 ('HT-107','Flatbed',5,'Peterbilt 579',2024,'TN6F11','TN',53,48000,'active'),
 ('HT-108','Conestoga',5,'Kenworth T680',2023,'MO8C30','MO',53,44000,'active'),
 ('HT-109','Hotshot',3,'Ram 5500',2024,'OH5H62','OH',40,16500,'active'),
 ('HT-110','Dry Van',5,'Freightliner Cascadia',2022,'TX2V90','TX',53,45000,'active'),
 ('HT-111','Reefer',5,'Volvo VNL 760',2023,'GA4R08','GA',53,44000,'active'),
 ('HT-112','RGN',8,'Western Star 49X',2024,'TX8R45','TX',30,150000,'active');

WITH d AS (SELECT id, row_number() OVER (ORDER BY created_at, id) rn FROM public.drivers),
t AS (SELECT id, row_number() OVER (ORDER BY unit_no) rn FROM public.trucks)
UPDATE public.trucks tr SET driver_id = d.id FROM t JOIN d ON d.rn = t.rn WHERE tr.id = t.id;