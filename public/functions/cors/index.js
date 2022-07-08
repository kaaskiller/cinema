export async function onRequest(context) {
	// Contents of context object
	const {
		request, // same as existing Worker API
		env, // same as existing Worker API
		params, // if filename includes [id] or [[path]]
		waitUntil, // same as ctx.waitUntil in existing Worker API
		next, // used for middleware or to fetch assets
		data, // arbitrary space for passing data between middlewares
	} = context;

	isOPTIONS = (request.method == "OPTIONS");
	var origin_url = new URL(request.url);

	function fix(myHeaders) {
		//            myHeaders.set("Access-Control-Allow-Origin", "*");
		myHeaders.set("Access-Control-Allow-Origin", request.headers.get("Origin"));
		if (isOPTIONS) {
			myHeaders.set("Access-Control-Allow-Methods", request.headers.get("access-control-request-method"));
			acrh = request.headers.get("access-control-request-headers");
			//myHeaders.set("Access-Control-Allow-Credentials", "true");

			if (acrh) {
				myHeaders.set("Access-Control-Allow-Headers", acrh);
			}

			myHeaders.delete("X-Content-Type-Options");
		}
		return myHeaders;
	}
	var fetch_url = decodeURIComponent(decodeURIComponent(origin_url.get("url")));

	var orig = request.headers.get("Origin");

	var remIp = request.headers.get("CF-Connecting-IP");

		xheaders = request.headers.get("x-cors-headers");

		if (xheaders != null) {
			try {
				xheaders = JSON.parse(xheaders);
			} catch (e) { }
		}

		if (fetch_url) {
			recv_headers = {};
			for (var pair of request.headers.entries()) {
				if ((pair[0].match("^origin") == null) &&
					(pair[0].match("eferer") == null) &&
					(pair[0].match("^cf-") == null) &&
					(pair[0].match("^x-forw") == null) &&
					(pair[0].match("^x-cors-headers") == null)
				) recv_headers[pair[0]] = pair[1];
			}

			if (xheaders != null) {
				Object.entries(xheaders).forEach((c) => recv_headers[c[0]] = c[1]);
			}

			newreq = new Request(request, {
				"headers": recv_headers
			});

			var response = await fetch(fetch_url, newreq);
			var myHeaders = new Headers(response.headers);
			cors_headers = [];
			allh = {};
			for (var pair of response.headers.entries()) {
				cors_headers.push(pair[0]);
				allh[pair[0]] = pair[1];
			}
			cors_headers.push("cors-received-headers");
			myHeaders = fix(myHeaders);

			myHeaders.set("Access-Control-Expose-Headers", cors_headers.join(","));

			myHeaders.set("cors-received-headers", JSON.stringify(allh));

			if (isOPTIONS) {
				var body = null;
			} else {
				var body = await response.arrayBuffer();
			}

			var init = {
				headers: myHeaders,
				status: (isOPTIONS ? 200 : response.status),
				statusText: (isOPTIONS ? "OK" : response.statusText)
			};
			return new Response(body, init);

		} else {
			var myHeaders = new Headers();
			myHeaders = fix(myHeaders);

			if (typeof request.cf != "undefined") {
				if (typeof request.cf.country != "undefined") {
					country = request.cf.country;
				} else
					country = false;

				if (typeof request.cf.colo != "undefined") {
					colo = request.cf.colo;
				} else
					colo = false;
			} else {
				country = false;
				colo = false;
			}

			return new Response(
				"CLOUDFLARE-CORS-ANYWHERE\n\n" +
				(orig != null ? "Origin: " + orig + "\n" : "") +
				"Ip: " + remIp + "\n" +
				(country ? "Country: " + country + "\n" : "") +
				(colo ? "Datacenter: " + colo + "\n" : "") + "\n" +
				((xheaders != null) ? "\nx-cors-headers: " + JSON.stringify(xheaders) : ""),
				{ status: 200, headers: myHeaders }
			);
		}
}