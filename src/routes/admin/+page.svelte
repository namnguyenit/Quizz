<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { BarChart2, LogOut, Clock, Globe, Laptop, Smartphone, Eye, Server, RefreshCw, Activity, Search } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';

	let { data, form } = $props<{ data: PageData; form: ActionData }>();

	// Auto-refresh (Realtime emulation)
	onMount(() => {
		let interval: ReturnType<typeof setInterval>;
		if (data.authorized) {
			interval = setInterval(() => {
				invalidateAll();
			}, 5000); // Refresh every 5 seconds
		}
		return () => clearInterval(interval);
	});

	let timeRange = $state<'24h' | '7d' | '30d' | 'date'>('24h');
	let selectedDate = $state(new Date().toISOString().split('T')[0]);
	let searchQuery = $state('');

	const filteredLogs = $derived.by(() => {
		const now = Date.now();
		let cutoff = now;
		let endTime = Infinity;

		if (timeRange === '24h') cutoff -= 24 * 3600 * 1000;
		else if (timeRange === '7d') cutoff -= 7 * 24 * 3600 * 1000;
		else if (timeRange === '30d') cutoff -= 30 * 24 * 3600 * 1000;
		else if (timeRange === 'date') {
			const startOfDay = new Date(`${selectedDate}T00:00:00`);
			cutoff = startOfDay.getTime();
			const endOfDay = new Date(`${selectedDate}T23:59:59.999`);
			endTime = endOfDay.getTime();
		}
		
		return data.logs.filter((l: any) => {
			if (!l.visited_at) return false;
			const time = new Date(l.visited_at + 'Z').getTime();
			return time >= cutoff && time <= endTime;
		});
	});

	const displayedLogs = $derived.by(() => {
		if (!searchQuery.trim()) return filteredLogs;
		const query = searchQuery.toLowerCase();
		return filteredLogs.filter((l: any) => 
			(l.visitor_name || '').toLowerCase().includes(query) ||
			(l.ip_address || '').toLowerCase().includes(query) ||
			(l.location || '').toLowerCase().includes(query) ||
			(l.device || '').toLowerCase().includes(query) ||
			(l.os || '').toLowerCase().includes(query) ||
			(l.browser || '').toLowerCase().includes(query)
		);
	});

	// Process data for charts
	const browserStats = $derived.by(() => {
		const counts: Record<string, number> = {};
		filteredLogs.forEach((l: any) => {
			counts[l.browser] = (counts[l.browser] || 0) + 1;
		});
		return Object.entries(counts)
			.map(([label, count]) => ({ label, count }))
			.sort((a, b) => b.count - a.count);
	});

	const deviceStats = $derived.by(() => {
		const counts: Record<string, number> = {};
		filteredLogs.forEach((l: any) => {
			counts[l.device] = (counts[l.device] || 0) + 1;
		});
		return Object.entries(counts)
			.map(([label, count]) => ({ label, count }))
			.sort((a, b) => b.count - a.count);
	});

	const locationStats = $derived.by(() => {
		const counts: Record<string, number> = {};
		filteredLogs.forEach((l: any) => {
			const loc = l.location || 'Unknown';
			counts[loc] = (counts[loc] || 0) + 1;
		});
		return Object.entries(counts)
			.map(([label, count]) => ({ label, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 5); // top 5
	});

	const timeSeriesStats = $derived.by(() => {
		const bins: Record<string, number> = {};
		const now = Date.now();
		
		if (timeRange === '24h' || timeRange === 'date') {
			if (timeRange === '24h') {
				// Initialize the last 24 hours with 0
				for (let i = 23; i >= 0; i--) {
					const d = new Date(now - i * 3600 * 1000);
					const label = `${d.getHours().toString().padStart(2, '0')}:00`;
					bins[label] = 0;
				}
			} else {
				// Initialize 24 slots for the selected date (00:00 to 23:00)
				for (let i = 0; i < 24; i++) {
					const label = `${i.toString().padStart(2, '0')}:00`;
					bins[label] = 0;
				}
			}

			filteredLogs.forEach((l: any) => {
				const time = new Date(l.visited_at + 'Z').getTime();
				const label = `${new Date(time).getHours().toString().padStart(2, '0')}:00`;
				if (bins[label] !== undefined) bins[label]++;
			});
		} else { // 7d or 30d
			const days = timeRange === '7d' ? 7 : 30;
			for (let i = days - 1; i >= 0; i--) {
				const d = new Date(now - i * 24 * 3600 * 1000);
				const label = `${d.getDate()}/${d.getMonth()+1}`;
				bins[label] = 0;
			}
			filteredLogs.forEach((l: any) => {
				const time = new Date(l.visited_at + 'Z').getTime();
				const d = new Date(time);
				const label = `${d.getDate()}/${d.getMonth()+1}`;
				if (bins[label] !== undefined) bins[label]++;
			});
		}

		const result = Object.entries(bins).map(([time, count]) => ({ time, count }));
		const maxCount = Math.max(...result.map(r => r.count), 1);
		
		return { data: result, maxCount };
	});

	const totalDuration = $derived(filteredLogs.reduce((acc: number, curr: any) => acc + curr.duration, 0));
	const averageDuration = $derived(filteredLogs.length > 0 ? (totalDuration / filteredLogs.length) : 0);

	const uniqueVisitorsCount = $derived.by(() => {
		const uniqueIds = new Set();
		filteredLogs.forEach((l: any) => {
			if (l.visitor_id) uniqueIds.add(l.visitor_id);
			else uniqueIds.add(l.ip_address); // fallback nếu record cũ chưa có visitor_id
		});
		return uniqueIds.size;
	});

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
	<div class="h-[100dvh] w-screen overflow-y-auto flex items-center justify-center bg-gray-950 p-4 relative z-10">
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
	<div class="h-[100dvh] w-screen overflow-y-auto bg-gray-950 text-gray-200 p-4 md:p-8 font-sans relative z-10">
		<div class="max-w-7xl mx-auto space-y-6 pb-20">
			
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
				<div class="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
					<!-- Range Selector -->
					<div class="flex flex-wrap items-center gap-2 mr-0 sm:mr-4">
						<div class="flex bg-gray-950 rounded-xl p-1 border border-gray-800">
							<button 
								class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors {timeRange === '24h' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}"
								onclick={() => timeRange = '24h'}
							>24h</button>
							<button 
								class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors {timeRange === '7d' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}"
								onclick={() => timeRange = '7d'}
							>7d</button>
							<button 
								class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors {timeRange === '30d' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}"
								onclick={() => timeRange = '30d'}
							>30d</button>
						</div>

						<!-- Custom Date Picker -->
						<div class="flex items-center bg-gray-950 border border-gray-800 rounded-xl px-3 transition-colors {timeRange === 'date' ? 'ring-1 ring-blue-500 border-blue-500/50' : ''}">
							<input 
								type="date" 
								class="bg-transparent text-sm text-gray-300 py-2 outline-none cursor-pointer [color-scheme:dark]"
								bind:value={selectedDate}
								onchange={() => timeRange = 'date'}
								onclick={() => timeRange = 'date'}
							/>
						</div>
					</div>

					<button onclick={() => window.location.reload()} class="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm font-medium transition-colors cursor-pointer">
						<RefreshCw size={16} /> Refresh
					</button>
					<form method="POST" action="?/logout">
						<button type="submit" class="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium transition-colors cursor-pointer">
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
						<p class="text-gray-400 text-xs font-semibold uppercase tracking-wider">Unique Visitors</p>
						<h3 class="text-2xl font-bold text-white mt-0.5" title="{filteredLogs.length} Total Sessions">{uniqueVisitorsCount}</h3>
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

			<!-- Traffic Over Time Chart -->
			<div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
				<h3 class="text-white font-semibold mb-6 flex items-center gap-2">
					<Activity size={18} class="text-blue-400" />
					Traffic Overview ({timeRange === '24h' ? 'Last 24 Hours' : timeRange === '7d' ? 'Last 7 Days' : timeRange === '30d' ? 'Last 30 Days' : `${selectedDate.split('-').reverse().join('/')}`})
				</h3>
				<div class="flex items-end gap-1.5 md:gap-2 h-40 w-full relative border-b border-gray-800 pb-2">
					<!-- Y-axis Max Indicator -->
					<div class="absolute left-0 top-0 text-xs text-gray-500 font-medium">
						{timeSeriesStats.maxCount}
					</div>
					{#each timeSeriesStats.data as point}
						<div class="flex-1 flex flex-col justify-end group relative h-full">
							<!-- Tooltip -->
							<div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 text-gray-200 text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
								<span class="font-bold text-white">{point.count}</span> visits <br/> at {point.time}
							</div>
							
							<!-- Bar -->
							<div 
								class="w-full bg-blue-500/60 hover:bg-blue-400 rounded-t-sm transition-all duration-300 relative {point.count === 0 ? 'bg-gray-800/50 hover:bg-gray-700/50' : ''}" 
								style="height: {Math.max((point.count / timeSeriesStats.maxCount) * 100, 2)}%;">
							</div>
							
							<!-- Label -->
							<div class="text-[9px] md:text-[11px] text-gray-500 mt-2 text-center truncate absolute -bottom-6 w-full group-hover:text-blue-400 transition-colors pointer-events-none" style="transform: translateX(-50%); left: 50%;">
								{point.time.replace(':00', 'h')}
							</div>
						</div>
					{/each}
				</div>
				<div class="mt-6 text-center text-xs text-gray-500">{timeRange === '24h' || timeRange === 'date' ? 'Hourly visit distribution' : 'Daily visit distribution'}</div>
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
									<div class="bg-blue-500 h-full rounded-full transition-all duration-500" style="width: {Math.max((b.count / filteredLogs.length) * 100, 2)}%;"></div>
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
									<div class="bg-violet-500 h-full rounded-full transition-all duration-500" style="width: {Math.max((d.count / filteredLogs.length) * 100, 2)}%;"></div>
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
									<div class="bg-orange-500 h-full rounded-full transition-all duration-500" style="width: {Math.max((loc.count / filteredLogs.length) * 100, 2)}%;"></div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Main Log Table -->
			<div class="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
				<div class="p-4 md:p-6 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<h3 class="text-white font-semibold flex items-center gap-2"><Server size={18} class="text-emerald-400" /> Raw Access Logs</h3>
					<div class="relative w-full sm:w-64 lg:w-80">
						<Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
						<input 
							type="text" 
							placeholder="Search IP, Location, OS, Browser..." 
							bind:value={searchQuery}
							class="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
						/>
					</div>
				</div>
				<div class="overflow-x-auto w-full">
					<table class="w-full text-left text-sm whitespace-nowrap">
						<thead class="bg-gray-950/50 text-gray-400 sticky top-0 backdrop-blur-sm z-10">
							<tr>
								<th class="px-6 py-3 font-semibold w-12">#</th>
								<th class="px-6 py-3 font-semibold">User / IP</th>
								<th class="px-6 py-3 font-semibold">Location</th>
								<th class="px-6 py-3 font-semibold">Device & OS</th>
								<th class="px-6 py-3 font-semibold">Browser</th>
								<th class="px-6 py-3 font-semibold">Status</th>
								<th class="px-6 py-3 font-semibold">Duration</th>
								<th class="px-6 py-3 font-semibold">Access Time</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800/60 text-gray-300 relative z-0">
							{#each displayedLogs as row, i}
								{@const status = getOnlineStatus(row.visited_at, row.duration)}
								<tr class="hover:bg-gray-800/40 transition-colors">
									<td class="px-6 py-3.5 text-gray-500">{i + 1}</td>
									<td class="px-6 py-3.5">
										{#if row.visitor_name}
											<div class="font-semibold text-white">{row.visitor_name}</div>
											<div class="text-[10px] text-gray-500 font-mono mt-0.5" title="IP Address">{row.ip_address}</div>
										{:else}
											<div class="font-mono text-emerald-400/90">{row.ip_address}</div>
										{/if}
									</td>
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
							{#if displayedLogs.length === 0}
								<tr>
									<td colspan="8" class="px-6 py-12 text-center text-gray-500 italic">
										{#if searchQuery}
											No access logs found matching "{searchQuery}".
										{:else}
											No access logs found in this time range.
										{/if}
									</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>
{/if}
