const supabaseUrl = "https://rijnlxwbcvnlmlwnagic.supabase.co";
const supabaseKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpam5seHdiY3ZubG1sd25hZ2ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzc0NTA1OTcsImV4cCI6MTk5MzAyNjU5N30.zzdsBgnIiNUvdmGRCteg-yfAXZxfGHuS15VOpI_Mpys";
const db = supabase.createClient(supabaseUrl, supabaseKey);

async function getData(e) {
	e.preventDefault();

	let { data: test, error } = await db.from("test").select("name");
	if (test) {
		console.log(test);
	}
}
