<script>
	import Seo from "$lib/Seo.svelte";

	let keywords = [
		"Google Cloud Platform", "Amazon Web Services",
		"Linux", "FreeBSD",
		"Python", "Django", "Flask", "SQLAlchemy",
		"C", "CMake",
		"Ansible", "Packer", "Terraform", "Bash",
		"PostgreSQL", "MySQL", "InfluxDB",
		"Gunicorn", "uWSGI", "nginx", "Apache httpd",
		"Pub/Sub", "Celery", "RabbitMQ",
		"ffmpeg", "HLS",
		"HTML", "CSS", "SCSS", "JavaScript",
		"HTTP", "APIs", "TCP/IP",
	];
	let hobbies = [
		"Gaming", "Trading", "Biking", "Climbing",
	];
</script>

<Seo
	title="About"
	description="About the author"
/>

<div class="
	mx-auto my-10
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

<div class="flex flex-wrap gap-2 justify-center">
	{#each keywords as keyword}
		<div class="badge">
			{keyword}
		</div>
	{/each}
</div>

<div class="my-12 flex flex-wrap gap-2 justify-center">
	{#each hobbies as keyword}
		<div class="badge">
			{keyword}
		</div>
	{/each}
</div>

<div class="flex justify-between items-center p-10">
	<ul class="contact-links">
		<li>
			<a href="mailto:mattias.lindvall@gmail.com">
				<i class="fa fa-envelope-o fa-fw"></i>
				<span>Email</span>
			</a>
		</li>
		<li>
			<a href="https://www.linkedin.com/in/mattiaslindvall/">
				<i class="fa fa-linkedin fa-fw"></i>
				<span>LinkedIn</span>
			</a>
		</li>
		<li>
			<a href="https://gitlab.com/thnee">
				<i class="fa fa-gitlab fa-fw"></i>
				<span>Gitlab</span>
			</a>
		</li>
		<li>
			<a href="https://github.com/thnee">
				<i class="fa fa-github-alt fa-fw"></i>
				<span>Github</span>
			</a>
		</li>
		<li>
			<a href="https://stackexchange.com/users/171980/thnee">
				<i class="fa fa-stack-exchange fa-fw"></i>
				<span>StackExchange</span>
			</a>
		</li>
		<li>
			<a href="https://www.filmtipset.se/medlem/thnee">
				<i class="fa fa-film fa-fw"></i>
				<span>Filmtipset</span>
			</a>
		</li>
	</ul>

	<div class="badges">
		<a href="https://freebsdfoundation.org/donate" target="_blank">
			<img
				src="https://freebsdfoundation.org/wp-content/uploads/2015/12/proud_donor.gif"
				alt="Proud Donor"
				title="FreeBSD Foundation Donor"
			>
		</a>
	</div>
</div>
