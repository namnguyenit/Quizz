<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { BarChart2, LogOut, Clock, Globe, Laptop, Smartphone, Eye, Server, RefreshCw } from '@lucide/svelte';

	let { data, form } = $props<{ data: PageData; form: ActionData }>();

	// Process data for charts
	const browserStats = $derived.by(() => {
		const counts: Record<string, number> = {};
		data.logs.forEach((l: any) => {
			counts[l.browser] = (counts[l.browser] || 0) + 1;
		});
		return Object.entries(counts)
			.map(([label, count]) => ({ label, count }))
			.sort((a, b) => b.count - a.count);
	});

	const deviceStats = $derived.by(() => {
		const counts: Record<string, number> = {};
		data.logs.forEach((l: any) => {
			counts[l.device] = (counts[l.device] || 0) + 1;
		});
		return Object.entries(counts)
			.map(([label, count]) => ({ label, count }))
			.sort((a, b) => b.count - a.count);
	});

	const locationStats = $derived.by(() => {
		const counts: Record<string, number> = {};
		data.logs.forEach((l: any) => {
			const loc = l.location || 'Unknown';
			counts[loc] = (counts[loc] || 0) + 1;
		});
		return Object.entries(counts)
			.map(([label, count]) => ({ label, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 5); // top 5
	});

	const totalDuration = $derived(data.logs.reduce((acc: number, curr: any) => acc + curr.duration, 0));
	const averageDuration = $derived(data.logs.length > 0 ? (totalDuration / data.logs.length) : 0);

	function formatDuration(seconds: number): string {
		if (seconds < 60) return `${Math.floor(seconds)}s`;
		return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
	}

	function formatDate(dateStr: string): string {
		if (!dateStr) return 'Unknown';
		const d = new Date(dateStr + 'Z'); // sqlite timestamp is UTC
		return d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
	}

	function getOnlineStatus(dateStr: string, durationSec: number): { isOnline: boolean, text: string } {
		if (!dateStr) return { isOnline: false, text: 'Unknown' };
		const start = new Date(dateStr + 'Z').getTime();
		const lastActive = start + (durationSec * 1000);
		const now = Date.now();
		const diffSec = (now - lastActive) / 1000;

		if (diffSec < 40) {
			return { isOnline: true, text: 'Online' };
		} else {
			const diffMin = Math.floor(diffSec / 60);
			if (diffMin === 0) return { isOnline: false, text: 'Rời đi vài giây trước' };
			if (diffMin < 60) return { isOnline: false, text: `Rời đi ${diffMin} phút trước` };
			const diffHour = Math.floor(diffMin / 60);
			if (diffHour < 24) return { isOnline: false, text: `Rời đi ${diffHour} giờ trước` };
			const diffDay = Math.floor(diffHour / 24);
			return { isOnline: false, text: `Rời đi ${diffDay} ngày trước` };
		}
	}

</script>

<svelte:head>
	<title>Admin Dashboard - Traffic Analytics</title>
</svelte:head>

<!-- LOGIN VIEW -->
{#if !data.authorized}
	<div class="min-h-screen flex items-center justify-center bg-gray-950 p-4">
		<div class="bg-gray-900 border border-gray-800 p-8 rounded-2xl w-full max-w-sm shadow-2xl">
			<div class="text-center mb-8">
				<Server class="mx-auto text-blue-500 mb-3" size={48} />
				<h1 class="text-2xl font-bold text-white">Admin Login</h1>
				<p class="text-gray-400 text-sm mt-1">Requires authentication to view logs</p>
			</div>
			
			<form method="POST" action="?/login" class="flex flex-col gap-4">
				{#if form?.error}
					<div class="bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-2 rounded-lg text-sm font-medium">
						{form.error}
					</div>
				{/if}
				<div>
					<label for="password" class="block text-gray-400 text-sm mb-1.5 ml-1">Master Password</label>
					<input 
						type="password" 
						id="password" 
						name="password" 
						class="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
						placeholder="••••••••••••"
						required
					/>
				</div>
				<button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform active:scale-95 mt-2">
					Access Dashboard
				</button>
			</form>
		</div>
	</div>
{:else}
<!-- DASHBOARD VIEW -->
	<div class="min-h-screen bg-gray-950 text-gray-200 p-4 md:p-8 font-sans">
		<div class="max-w-7xl mx-auto space-y-6">
			
			<!-- Header -->
			<header class="flex flex-col md:flex-row items-center justify-between bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 shadow-xl">
				<div class="flex items-center gap-3">
					<div class="bg-blue-500/20 p-2.5 rounded-xl border border-blue-500/30">
						<BarChart2 class="text-blue-400" size={24} />
					</div>
					<div>
						<h1 class="text-xl md:text-2xl font-bold text-white tracking-tight">Traffic Analytics</h1>
						<p class="text-gray-400 text-sm">Turso Real-time Edge Database</p>
					</div>
				</div>
				<div class="flex gap-3 mt-4 md:mt-0">
					<button onclick={() => window.location.reload()} class="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm font-medium transition-colors">
						<RefreshCw size={16} /> Refresh
					</button>
					<form method="POST" action="?/logout">
						<button class="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium transition-colors">
							<LogOut size={16} /> Logout
						</button>
					</form>
				</div>
			</header>

			<!-- KPI Cards -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<div class="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
					<div class="bg-indigo-500/20 p-3 rounded-full text-indigo-400"><Eye size={24} /></div>
					<div>
						<p class="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Visitors</p>
						<h3 class="text-2xl font-bold text-white mt-0.5">{data.logs.length}</h3>
					</div>
				</div>
				<div class="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
					<div class="bg-green-500/20 p-3 rounded-full text-green-400"><Clock size={24} /></div>
					<div>
						<p class="text-gray-400 text-xs font-semibold uppercase tracking-wider">Avg Session Time</p>
						<h3 class="text-2xl font-bold text-white mt-0.5">{formatDuration(averageDuration)}</h3>
					</div>
				</div>
				<div class="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
					<div class="bg-orange-500/20 p-3 rounded-full text-orange-400"><Globe size={24} /></div>
					<div>
						<p class="text-gray-400 text-xs font-semibold uppercase tracking-wider">Top Location</p>
						<h3 class="text-lg font-bold text-white mt-0.5 line-clamp-1">{locationStats[0]?.label || 'N/A'}</h3>
					</div>
				</div>
				<div class="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
					<div class="bg-violet-500/20 p-3 rounded-full text-violet-400"><Smartphone size={24} /></div>
					<div>
						<p class="text-gray-400 text-xs font-semibold uppercase tracking-wider">Top Device</p>
						<h3 class="text-lg font-bold text-white mt-0.5 line-clamp-1">{deviceStats[0]?.label || 'N/A'}</h3>
					</div>
				</div>
			</div>

			<!-- Charts Area -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- Browsers -->
				<div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
					<h3 class="text-white font-semibold mb-4 flex items-center gap-2"><Globe size={18} class="text-blue-400" /> Browser Distribution</h3>
					<div class="space-y-4">
						{#each browserStats as b}
							<div>
								<div class="flex justify-between text-sm mb-1.5"><span class="font-medium">{b.label}</span> <span class="text-gray-400">{b.count} visits</span></div>
								<div class="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
									<div class="bg-blue-500 h-full rounded-full" style="width: {Math.max((b.count / data.logs.length) * 100, 2)}%;"></div>
								</div>
							</div>
						{/each}
					</div>
				</div>
				<!-- Devices -->
				<div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
					<h3 class="text-white font-semibold mb-4 flex items-center gap-2"><Laptop size={18} class="text-violet-400" /> Device Types</h3>
					<div class="space-y-4">
						{#each deviceStats as d}
							<div>
								<div class="flex justify-between text-sm mb-1.5"><span class="font-medium">{d.label}</span> <span class="text-gray-400">{d.count} visits</span></div>
								<div class="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
									<div class="bg-violet-500 h-full rounded-full" style="width: {Math.max((d.count / data.logs.length) * 100, 2)}%;"></div>
								</div>
							</div>
						{/each}
					</div>
				</div>
				<!-- Top Locations -->
				<div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
					<h3 class="text-white font-semibold mb-4 flex items-center gap-2"><Globe size={18} class="text-orange-400" /> Top Locations</h3>
					<div class="space-y-4">
						{#each locationStats as loc}
							<div>
								<div class="flex justify-between text-sm mb-1.5"><span class="font-medium truncate pr-2">{loc.label}</span> <span class="text-gray-400 flex-shrink-0">{loc.count} visits</span></div>
								<div class="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
									<div class="bg-orange-500 h-full rounded-full" style="width: {Math.max((loc.count / data.logs.length) * 100, 2)}%;"></div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Main Log Table -->
			<div class="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg flex flex-col max-h-[600px]">
				<div class="p-6 border-b border-gray-800">
					<h3 class="text-white font-semibold flex items-center gap-2"><Server size={18} class="text-emerald-400" /> Raw Access Logs</h3>
				</div>
				<div class="overflow-x-auto overflow-y-auto flex-1 main-scrollbar">
					<table class="w-full text-left text-sm whitespace-nowrap">
						<thead class="bg-gray-950/50 text-gray-400 sticky top-0 backdrop-blur-sm z-10">
							<tr>
								<th class="px-6 py-3 font-semibold w-12">#</th>
								<th class="px-6 py-3 font-semibold">IP Address</th>
								<th class="px-6 py-3 font-semibold">Location</th>
								<th class="px-6 py-3 font-semibold">Device & OS</th>
								<th class="px-6 py-3 font-semibold">Browser</th>
								<th class="px-6 py-3 font-semibold">Status</th>
								<th class="px-6 py-3 font-semibold">Duration</th>
								<th class="px-6 py-3 font-semibold">Access Time</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800/60 text-gray-300 relative z-0">
							{#each data.logs as row, i}
								{@const status = getOnlineStatus(row.visited_at, row.duration)}
								<tr class="hover:bg-gray-800/40 transition-colors">
									<td class="px-6 py-3.5 text-gray-500">{i + 1}</td>
									<td class="px-6 py-3.5 font-mono text-emerald-400/90">{row.ip_address}</td>
									<td class="px-6 py-3.5"><div class="max-w-[150px] truncate" title={row.location}>{row.location}</div></td>
									<td class="px-6 py-3.5">{row.device} • {row.os}</td>
									<td class="px-6 py-3.5 text-blue-300/90">{row.browser}</td>
									<td class="px-6 py-3.5">
										{#if status.isOnline}
											<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
												<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
												{status.text}
											</span>
										{:else}
											<span class="text-xs text-gray-400 font-medium whitespace-nowrap">
												{status.text}
											</span>
										{/if}
									</td>
									<td class="px-6 py-3.5">
										<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 border border-gray-700">
											{formatDuration(row.duration)}
										</span>
									</td>
									<td class="px-6 py-3.5 text-xs text-gray-400 tracking-wide">{formatDate(row.visited_at)}</td>
								</tr>
							{/each}
							{#if data.logs.length === 0}
								<tr>
									<td colspan="8" class="px-6 py-12 text-center text-gray-500 italic">No access logs found yet.</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>
{/if}
