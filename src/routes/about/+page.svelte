<script>
	import ContactLink from "./ContactLink.svelte";

	import GithubIcon from "~icons/fa-brands/github";
	import GmailIcon from "~icons/logos/google-gmail";
	import GitlabIcon from "~icons/logos/gitlab";
	import LinkedInIcon from "~icons/logos/linkedin-icon";
	import StackOverflowIcon from "~icons/logos/stackoverflow-icon";
	import FilmProjectorIcon from "~icons/noto/film-projector";

	let keywords = [
		"Software Development", "DevOps", "DevEx",
		"Google Cloud Platform", "Amazon Web Services",
		"IAM", "VPC", "Compute",
		"Load balancing", "Service mesh", "Pub/Sub", "Obervability", "VPN", "VPS",
		"Linux", "FreeBSD",
		"OPNsense", "pfSense",
		"Terraform", "Packer", "Docker", "Ansible",
		"Consul", "Nomad",
		"Python", "Flask", "Sanic", "FastAPI", "Django", "SQLAlchemy", "Celery",
		"C", "CMake",
		"Golang", "Bash",
		"PostgreSQL", "MySQL", "InfluxDB", "SQLite",
		"Redis", "RabbitMQ",
		"Gunicorn", "uWSGI", "nginx", "Apache httpd",
		"HTML", "CSS", "SCSS", "JavaScript",
		"Svelte", "SvelteKit", "Vue.js", "Nuxt.js", "React", "Angular",
		"Tauri", "Capacitor",
		"HTTP", "APIs", "TCP/IP",
		"ffmpeg", "HLS",
	];
	let hobbies = [
		"Running", "Biking", "Gaming", "Movies",
	];
</script>

<div class="
	mx-auto mb-10
	flex flex-col gap-1
	text-center
">
	<div>
		Mattias Tomas Bobo Lindvall
	</div>
	<div>
		Computer person
	</div>
	<div>
		Stockholm, Sweden
	</div>
</div>

<div class="flex flex-wrap gap-3 justify-center">
	{#each keywords as keyword}
		<div class="badge">
			{keyword}
		</div>
	{/each}
</div>

<div class="flex flex-wrap gap-3 justify-center py-12">
	{#each hobbies as keyword}
		<div class="badge">
			{keyword}
		</div>
	{/each}
</div>

<div class="flex flex-col md:flex-row justify-between items-center py-4 px-32">
	<div class="flex flex-col gap-1.5">
		<ContactLink
			icon={GmailIcon}
			iconSize="20px"
			label="Email"
			href="mailto:mattias.lindvall@gmail.com"
		/>
		<ContactLink
			icon={LinkedInIcon}
			iconSize="28px"
			label="LinkedIn"
			href="https://www.linkedin.com/in/mattiaslindvall/"
		/>
		<ContactLink
			icon={GithubIcon}
			iconSize="28px"
			iconColor="white"
			label="Github"
			href="https://github.com/thnee"
		/>
		<ContactLink
			icon={GitlabIcon}
			iconSize="24px"
			label="Gitlab"
			href="https://gitlab.com/thnee"
		/>
		<ContactLink
			icon={StackOverflowIcon}
			iconSize="30px"
			label="StackOverflow"
			href="https://stackoverflow.com/users/399725/thnee"
		/>
		<ContactLink
			icon={FilmProjectorIcon}
			iconSize="32px"
			label="Filmtipset"
			href="https://www.filmtipset.se/medlem/thnee"
		/>
	</div>

	<div class="py-12 md:py-0">
		<a href="https://freebsdfoundation.org/donate" target="_blank">
			<img
				src="https://freebsdfoundation.org/wp-content/uploads/2015/12/proud_donor.gif"
				alt="Proud Donor"
				title="FreeBSD Foundation Donor"
				class="rounded-md"
			>
		</a>
	</div>
</div>
