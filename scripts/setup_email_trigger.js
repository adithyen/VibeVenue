const sql = `
CREATE OR REPLACE FUNCTION public.handle_registration_email_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payload jsonb;
  request_id bigint;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    payload := jsonb_build_object(
      'type', 'INSERT',
      'table', 'registrations',
      'schema', 'public',
      'record', row_to_json(NEW)
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
      payload := jsonb_build_object(
        'type', 'UPDATE',
        'table', 'registrations',
        'schema', 'public',
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      );
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  SELECT net.http_post(
    url := 'https://yrvijufespplklfnvsfg.supabase.co/functions/v1/send-event-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := payload
  ) INTO request_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_registration_email ON public.registrations;

CREATE TRIGGER trigger_registration_email
AFTER INSERT OR UPDATE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.handle_registration_email_trigger();
`;

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN || '';
  const res = await fetch('https://api.supabase.com/v1/projects/yrvijufespplklfnvsfg/database/query', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  const data = await res.json();
  console.log('Postgres Trigger Creation Result:', data);
}

main();
