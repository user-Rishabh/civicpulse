//#region node_modules/@google/generative-ai/dist/index.mjs
/**
* Contains the list of OpenAPI data types
* as defined by https://swagger.io/docs/specification/data-models/data-types/
* @public
*/
var SchemaType;
(function(SchemaType) {
	/** String type. */
	SchemaType["STRING"] = "string";
	/** Number type. */
	SchemaType["NUMBER"] = "number";
	/** Integer type. */
	SchemaType["INTEGER"] = "integer";
	/** Boolean type. */
	SchemaType["BOOLEAN"] = "boolean";
	/** Array type. */
	SchemaType["ARRAY"] = "array";
	/** Object type. */
	SchemaType["OBJECT"] = "object";
})(SchemaType || (SchemaType = {}));
/**
* @license
* Copyright 2024 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* @public
*/
var ExecutableCodeLanguage;
(function(ExecutableCodeLanguage) {
	ExecutableCodeLanguage["LANGUAGE_UNSPECIFIED"] = "language_unspecified";
	ExecutableCodeLanguage["PYTHON"] = "python";
})(ExecutableCodeLanguage || (ExecutableCodeLanguage = {}));
/**
* Possible outcomes of code execution.
* @public
*/
var Outcome;
(function(Outcome) {
	/**
	* Unspecified status. This value should not be used.
	*/
	Outcome["OUTCOME_UNSPECIFIED"] = "outcome_unspecified";
	/**
	* Code execution completed successfully.
	*/
	Outcome["OUTCOME_OK"] = "outcome_ok";
	/**
	* Code execution finished but with a failure. `stderr` should contain the
	* reason.
	*/
	Outcome["OUTCOME_FAILED"] = "outcome_failed";
	/**
	* Code execution ran for too long, and was cancelled. There may or may not
	* be a partial output present.
	*/
	Outcome["OUTCOME_DEADLINE_EXCEEDED"] = "outcome_deadline_exceeded";
})(Outcome || (Outcome = {}));
/**
* @license
* Copyright 2024 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* Possible roles.
* @public
*/
var POSSIBLE_ROLES = [
	"user",
	"model",
	"function",
	"system"
];
/**
* Harm categories that would cause prompts or candidates to be blocked.
* @public
*/
var HarmCategory;
(function(HarmCategory) {
	HarmCategory["HARM_CATEGORY_UNSPECIFIED"] = "HARM_CATEGORY_UNSPECIFIED";
	HarmCategory["HARM_CATEGORY_HATE_SPEECH"] = "HARM_CATEGORY_HATE_SPEECH";
	HarmCategory["HARM_CATEGORY_SEXUALLY_EXPLICIT"] = "HARM_CATEGORY_SEXUALLY_EXPLICIT";
	HarmCategory["HARM_CATEGORY_HARASSMENT"] = "HARM_CATEGORY_HARASSMENT";
	HarmCategory["HARM_CATEGORY_DANGEROUS_CONTENT"] = "HARM_CATEGORY_DANGEROUS_CONTENT";
	HarmCategory["HARM_CATEGORY_CIVIC_INTEGRITY"] = "HARM_CATEGORY_CIVIC_INTEGRITY";
})(HarmCategory || (HarmCategory = {}));
/**
* Threshold above which a prompt or candidate will be blocked.
* @public
*/
var HarmBlockThreshold;
(function(HarmBlockThreshold) {
	/** Threshold is unspecified. */
	HarmBlockThreshold["HARM_BLOCK_THRESHOLD_UNSPECIFIED"] = "HARM_BLOCK_THRESHOLD_UNSPECIFIED";
	/** Content with NEGLIGIBLE will be allowed. */
	HarmBlockThreshold["BLOCK_LOW_AND_ABOVE"] = "BLOCK_LOW_AND_ABOVE";
	/** Content with NEGLIGIBLE and LOW will be allowed. */
	HarmBlockThreshold["BLOCK_MEDIUM_AND_ABOVE"] = "BLOCK_MEDIUM_AND_ABOVE";
	/** Content with NEGLIGIBLE, LOW, and MEDIUM will be allowed. */
	HarmBlockThreshold["BLOCK_ONLY_HIGH"] = "BLOCK_ONLY_HIGH";
	/** All content will be allowed. */
	HarmBlockThreshold["BLOCK_NONE"] = "BLOCK_NONE";
})(HarmBlockThreshold || (HarmBlockThreshold = {}));
/**
* Probability that a prompt or candidate matches a harm category.
* @public
*/
var HarmProbability;
(function(HarmProbability) {
	/** Probability is unspecified. */
	HarmProbability["HARM_PROBABILITY_UNSPECIFIED"] = "HARM_PROBABILITY_UNSPECIFIED";
	/** Content has a negligible chance of being unsafe. */
	HarmProbability["NEGLIGIBLE"] = "NEGLIGIBLE";
	/** Content has a low chance of being unsafe. */
	HarmProbability["LOW"] = "LOW";
	/** Content has a medium chance of being unsafe. */
	HarmProbability["MEDIUM"] = "MEDIUM";
	/** Content has a high chance of being unsafe. */
	HarmProbability["HIGH"] = "HIGH";
})(HarmProbability || (HarmProbability = {}));
/**
* Reason that a prompt was blocked.
* @public
*/
var BlockReason;
(function(BlockReason) {
	BlockReason["BLOCKED_REASON_UNSPECIFIED"] = "BLOCKED_REASON_UNSPECIFIED";
	BlockReason["SAFETY"] = "SAFETY";
	BlockReason["OTHER"] = "OTHER";
})(BlockReason || (BlockReason = {}));
/**
* Reason that a candidate finished.
* @public
*/
var FinishReason;
(function(FinishReason) {
	FinishReason["FINISH_REASON_UNSPECIFIED"] = "FINISH_REASON_UNSPECIFIED";
	FinishReason["STOP"] = "STOP";
	FinishReason["MAX_TOKENS"] = "MAX_TOKENS";
	FinishReason["SAFETY"] = "SAFETY";
	FinishReason["RECITATION"] = "RECITATION";
	FinishReason["LANGUAGE"] = "LANGUAGE";
	FinishReason["BLOCKLIST"] = "BLOCKLIST";
	FinishReason["PROHIBITED_CONTENT"] = "PROHIBITED_CONTENT";
	FinishReason["SPII"] = "SPII";
	FinishReason["MALFORMED_FUNCTION_CALL"] = "MALFORMED_FUNCTION_CALL";
	FinishReason["OTHER"] = "OTHER";
})(FinishReason || (FinishReason = {}));
/**
* Task type for embedding content.
* @public
*/
var TaskType;
(function(TaskType) {
	TaskType["TASK_TYPE_UNSPECIFIED"] = "TASK_TYPE_UNSPECIFIED";
	TaskType["RETRIEVAL_QUERY"] = "RETRIEVAL_QUERY";
	TaskType["RETRIEVAL_DOCUMENT"] = "RETRIEVAL_DOCUMENT";
	TaskType["SEMANTIC_SIMILARITY"] = "SEMANTIC_SIMILARITY";
	TaskType["CLASSIFICATION"] = "CLASSIFICATION";
	TaskType["CLUSTERING"] = "CLUSTERING";
})(TaskType || (TaskType = {}));
/**
* @public
*/
var FunctionCallingMode;
(function(FunctionCallingMode) {
	FunctionCallingMode["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
	FunctionCallingMode["AUTO"] = "AUTO";
	FunctionCallingMode["ANY"] = "ANY";
	FunctionCallingMode["NONE"] = "NONE";
})(FunctionCallingMode || (FunctionCallingMode = {}));
/**
* The mode of the predictor to be used in dynamic retrieval.
* @public
*/
var DynamicRetrievalMode;
(function(DynamicRetrievalMode) {
	DynamicRetrievalMode["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
	DynamicRetrievalMode["MODE_DYNAMIC"] = "MODE_DYNAMIC";
})(DynamicRetrievalMode || (DynamicRetrievalMode = {}));
/**
* @license
* Copyright 2024 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* Basic error type for this SDK.
* @public
*/
var GoogleGenerativeAIError = class extends Error {
	constructor(message) {
		super(`[GoogleGenerativeAI Error]: ${message}`);
	}
};
/**
* Errors in the contents of a response from the model. This includes parsing
* errors, or responses including a safety block reason.
* @public
*/
var GoogleGenerativeAIResponseError = class extends GoogleGenerativeAIError {
	constructor(message, response) {
		super(message);
		this.response = response;
	}
};
/**
* Error class covering HTTP errors when calling the server. Includes HTTP
* status, statusText, and optional details, if provided in the server response.
* @public
*/
var GoogleGenerativeAIFetchError = class extends GoogleGenerativeAIError {
	constructor(message, status, statusText, errorDetails) {
		super(message);
		this.status = status;
		this.statusText = statusText;
		this.errorDetails = errorDetails;
	}
};
/**
* Errors in the contents of a request originating from user input.
* @public
*/
var GoogleGenerativeAIRequestInputError = class extends GoogleGenerativeAIError {};
/**
* Error thrown when a request is aborted, either due to a timeout or
* intentional cancellation by the user.
* @public
*/
var GoogleGenerativeAIAbortError = class extends GoogleGenerativeAIError {};
/**
* @license
* Copyright 2024 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
var DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com";
var DEFAULT_API_VERSION = "v1beta";
/**
* We can't `require` package.json if this runs on web. We will use rollup to
* swap in the version number here at build time.
*/
var PACKAGE_VERSION = "0.24.1";
var PACKAGE_LOG_HEADER = "genai-js";
var Task;
(function(Task) {
	Task["GENERATE_CONTENT"] = "generateContent";
	Task["STREAM_GENERATE_CONTENT"] = "streamGenerateContent";
	Task["COUNT_TOKENS"] = "countTokens";
	Task["EMBED_CONTENT"] = "embedContent";
	Task["BATCH_EMBED_CONTENTS"] = "batchEmbedContents";
})(Task || (Task = {}));
var RequestUrl = class {
	constructor(model, task, apiKey, stream, requestOptions) {
		this.model = model;
		this.task = task;
		this.apiKey = apiKey;
		this.stream = stream;
		this.requestOptions = requestOptions;
	}
	toString() {
		var _a, _b;
		const apiVersion = ((_a = this.requestOptions) === null || _a === void 0 ? void 0 : _a.apiVersion) || DEFAULT_API_VERSION;
		let url = `${((_b = this.requestOptions) === null || _b === void 0 ? void 0 : _b.baseUrl) || DEFAULT_BASE_URL}/${apiVersion}/${this.model}:${this.task}`;
		if (this.stream) url += "?alt=sse";
		return url;
	}
};
/**
* Simple, but may become more complex if we add more versions to log.
*/
function getClientHeaders(requestOptions) {
	const clientHeaders = [];
	if (requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.apiClient) clientHeaders.push(requestOptions.apiClient);
	clientHeaders.push(`${PACKAGE_LOG_HEADER}/${PACKAGE_VERSION}`);
	return clientHeaders.join(" ");
}
async function getHeaders(url) {
	var _a;
	const headers = new Headers();
	headers.append("Content-Type", "application/json");
	headers.append("x-goog-api-client", getClientHeaders(url.requestOptions));
	headers.append("x-goog-api-key", url.apiKey);
	let customHeaders = (_a = url.requestOptions) === null || _a === void 0 ? void 0 : _a.customHeaders;
	if (customHeaders) {
		if (!(customHeaders instanceof Headers)) try {
			customHeaders = new Headers(customHeaders);
		} catch (e) {
			throw new GoogleGenerativeAIRequestInputError(`unable to convert customHeaders value ${JSON.stringify(customHeaders)} to Headers: ${e.message}`);
		}
		for (const [headerName, headerValue] of customHeaders.entries()) {
			if (headerName === "x-goog-api-key") throw new GoogleGenerativeAIRequestInputError(`Cannot set reserved header name ${headerName}`);
			else if (headerName === "x-goog-api-client") throw new GoogleGenerativeAIRequestInputError(`Header name ${headerName} can only be set using the apiClient field`);
			headers.append(headerName, headerValue);
		}
	}
	return headers;
}
async function constructModelRequest(model, task, apiKey, stream, body, requestOptions) {
	const url = new RequestUrl(model, task, apiKey, stream, requestOptions);
	return {
		url: url.toString(),
		fetchOptions: Object.assign(Object.assign({}, buildFetchOptions(requestOptions)), {
			method: "POST",
			headers: await getHeaders(url),
			body
		})
	};
}
async function makeModelRequest(model, task, apiKey, stream, body, requestOptions = {}, fetchFn = fetch) {
	const { url, fetchOptions } = await constructModelRequest(model, task, apiKey, stream, body, requestOptions);
	return makeRequest(url, fetchOptions, fetchFn);
}
async function makeRequest(url, fetchOptions, fetchFn = fetch) {
	let response;
	try {
		response = await fetchFn(url, fetchOptions);
	} catch (e) {
		handleResponseError(e, url);
	}
	if (!response.ok) await handleResponseNotOk(response, url);
	return response;
}
function handleResponseError(e, url) {
	let err = e;
	if (err.name === "AbortError") {
		err = new GoogleGenerativeAIAbortError(`Request aborted when fetching ${url.toString()}: ${e.message}`);
		err.stack = e.stack;
	} else if (!(e instanceof GoogleGenerativeAIFetchError || e instanceof GoogleGenerativeAIRequestInputError)) {
		err = new GoogleGenerativeAIError(`Error fetching from ${url.toString()}: ${e.message}`);
		err.stack = e.stack;
	}
	throw err;
}
async function handleResponseNotOk(response, url) {
	let message = "";
	let errorDetails;
	try {
		const json = await response.json();
		message = json.error.message;
		if (json.error.details) {
			message += ` ${JSON.stringify(json.error.details)}`;
			errorDetails = json.error.details;
		}
	} catch (e) {}
	throw new GoogleGenerativeAIFetchError(`Error fetching from ${url.toString()}: [${response.status} ${response.statusText}] ${message}`, response.status, response.statusText, errorDetails);
}
/**
* Generates the request options to be passed to the fetch API.
* @param requestOptions - The user-defined request options.
* @returns The generated request options.
*/
function buildFetchOptions(requestOptions) {
	const fetchOptions = {};
	if ((requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.signal) !== void 0 || (requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeout) >= 0) {
		const controller = new AbortController();
		if ((requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeout) >= 0) setTimeout(() => controller.abort(), requestOptions.timeout);
		if (requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.signal) requestOptions.signal.addEventListener("abort", () => {
			controller.abort();
		});
		fetchOptions.signal = controller.signal;
	}
	return fetchOptions;
}
/**
* @license
* Copyright 2024 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* Adds convenience helper methods to a response object, including stream
* chunks (as long as each chunk is a complete GenerateContentResponse JSON).
*/
function addHelpers(response) {
	response.text = () => {
		if (response.candidates && response.candidates.length > 0) {
			if (response.candidates.length > 1) console.warn(`This response had ${response.candidates.length} candidates. Returning text from the first candidate only. Access response.candidates directly to use the other candidates.`);
			if (hadBadFinishReason(response.candidates[0])) throw new GoogleGenerativeAIResponseError(`${formatBlockErrorMessage(response)}`, response);
			return getText(response);
		} else if (response.promptFeedback) throw new GoogleGenerativeAIResponseError(`Text not available. ${formatBlockErrorMessage(response)}`, response);
		return "";
	};
	/**
	* TODO: remove at next major version
	*/
	response.functionCall = () => {
		if (response.candidates && response.candidates.length > 0) {
			if (response.candidates.length > 1) console.warn(`This response had ${response.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`);
			if (hadBadFinishReason(response.candidates[0])) throw new GoogleGenerativeAIResponseError(`${formatBlockErrorMessage(response)}`, response);
			console.warn("response.functionCall() is deprecated. Use response.functionCalls() instead.");
			return getFunctionCalls(response)[0];
		} else if (response.promptFeedback) throw new GoogleGenerativeAIResponseError(`Function call not available. ${formatBlockErrorMessage(response)}`, response);
	};
	response.functionCalls = () => {
		if (response.candidates && response.candidates.length > 0) {
			if (response.candidates.length > 1) console.warn(`This response had ${response.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`);
			if (hadBadFinishReason(response.candidates[0])) throw new GoogleGenerativeAIResponseError(`${formatBlockErrorMessage(response)}`, response);
			return getFunctionCalls(response);
		} else if (response.promptFeedback) throw new GoogleGenerativeAIResponseError(`Function call not available. ${formatBlockErrorMessage(response)}`, response);
	};
	return response;
}
/**
* Returns all text found in all parts of first candidate.
*/
function getText(response) {
	var _a, _b, _c, _d;
	const textStrings = [];
	if ((_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0].content) === null || _b === void 0 ? void 0 : _b.parts) for (const part of (_d = (_c = response.candidates) === null || _c === void 0 ? void 0 : _c[0].content) === null || _d === void 0 ? void 0 : _d.parts) {
		if (part.text) textStrings.push(part.text);
		if (part.executableCode) textStrings.push("\n```" + part.executableCode.language + "\n" + part.executableCode.code + "\n```\n");
		if (part.codeExecutionResult) textStrings.push("\n```\n" + part.codeExecutionResult.output + "\n```\n");
	}
	if (textStrings.length > 0) return textStrings.join("");
	else return "";
}
/**
* Returns functionCall of first candidate.
*/
function getFunctionCalls(response) {
	var _a, _b, _c, _d;
	const functionCalls = [];
	if ((_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0].content) === null || _b === void 0 ? void 0 : _b.parts) {
		for (const part of (_d = (_c = response.candidates) === null || _c === void 0 ? void 0 : _c[0].content) === null || _d === void 0 ? void 0 : _d.parts) if (part.functionCall) functionCalls.push(part.functionCall);
	}
	if (functionCalls.length > 0) return functionCalls;
	else return;
}
var badFinishReasons = [
	FinishReason.RECITATION,
	FinishReason.SAFETY,
	FinishReason.LANGUAGE
];
function hadBadFinishReason(candidate) {
	return !!candidate.finishReason && badFinishReasons.includes(candidate.finishReason);
}
function formatBlockErrorMessage(response) {
	var _a, _b, _c;
	let message = "";
	if ((!response.candidates || response.candidates.length === 0) && response.promptFeedback) {
		message += "Response was blocked";
		if ((_a = response.promptFeedback) === null || _a === void 0 ? void 0 : _a.blockReason) message += ` due to ${response.promptFeedback.blockReason}`;
		if ((_b = response.promptFeedback) === null || _b === void 0 ? void 0 : _b.blockReasonMessage) message += `: ${response.promptFeedback.blockReasonMessage}`;
	} else if ((_c = response.candidates) === null || _c === void 0 ? void 0 : _c[0]) {
		const firstCandidate = response.candidates[0];
		if (hadBadFinishReason(firstCandidate)) {
			message += `Candidate was blocked due to ${firstCandidate.finishReason}`;
			if (firstCandidate.finishMessage) message += `: ${firstCandidate.finishMessage}`;
		}
	}
	return message;
}
/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
function __await(v) {
	return this instanceof __await ? (this.v = v, this) : new __await(v);
}
function __asyncGenerator(thisArg, _arguments, generator) {
	if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
	var g = generator.apply(thisArg, _arguments || []), i, q = [];
	return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
		return this;
	}, i;
	function verb(n) {
		if (g[n]) i[n] = function(v) {
			return new Promise(function(a, b) {
				q.push([
					n,
					v,
					a,
					b
				]) > 1 || resume(n, v);
			});
		};
	}
	function resume(n, v) {
		try {
			step(g[n](v));
		} catch (e) {
			settle(q[0][3], e);
		}
	}
	function step(r) {
		r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
	}
	function fulfill(value) {
		resume("next", value);
	}
	function reject(value) {
		resume("throw", value);
	}
	function settle(f, v) {
		if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
	}
}
/**
* @license
* Copyright 2024 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
var responseLineRE = /^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;
/**
* Process a response.body stream from the backend and return an
* iterator that provides one complete GenerateContentResponse at a time
* and a promise that resolves with a single aggregated
* GenerateContentResponse.
*
* @param response - Response from a fetch call
*/
function processStream(response) {
	const [stream1, stream2] = getResponseStream(response.body.pipeThrough(new TextDecoderStream("utf8", { fatal: true }))).tee();
	return {
		stream: generateResponseSequence(stream1),
		response: getResponsePromise(stream2)
	};
}
async function getResponsePromise(stream) {
	const allResponses = [];
	const reader = stream.getReader();
	while (true) {
		const { done, value } = await reader.read();
		if (done) return addHelpers(aggregateResponses(allResponses));
		allResponses.push(value);
	}
}
function generateResponseSequence(stream) {
	return __asyncGenerator(this, arguments, function* generateResponseSequence_1() {
		const reader = stream.getReader();
		while (true) {
			const { value, done } = yield __await(reader.read());
			if (done) break;
			yield yield __await(addHelpers(value));
		}
	});
}
/**
* Reads a raw stream from the fetch response and join incomplete
* chunks, returning a new stream that provides a single complete
* GenerateContentResponse in each iteration.
*/
function getResponseStream(inputStream) {
	const reader = inputStream.getReader();
	return new ReadableStream({ start(controller) {
		let currentText = "";
		return pump();
		function pump() {
			return reader.read().then(({ value, done }) => {
				if (done) {
					if (currentText.trim()) {
						controller.error(new GoogleGenerativeAIError("Failed to parse stream"));
						return;
					}
					controller.close();
					return;
				}
				currentText += value;
				let match = currentText.match(responseLineRE);
				let parsedResponse;
				while (match) {
					try {
						parsedResponse = JSON.parse(match[1]);
					} catch (e) {
						controller.error(new GoogleGenerativeAIError(`Error parsing JSON response: "${match[1]}"`));
						return;
					}
					controller.enqueue(parsedResponse);
					currentText = currentText.substring(match[0].length);
					match = currentText.match(responseLineRE);
				}
				return pump();
			}).catch((e) => {
				let err = e;
				err.stack = e.stack;
				if (err.name === "AbortError") err = new GoogleGenerativeAIAbortError("Request aborted when reading from the stream");
				else err = new GoogleGenerativeAIError("Error reading from the stream");
				throw err;
			});
		}
	} });
}
/**
* Aggregates an array of `GenerateContentResponse`s into a single
* GenerateContentResponse.
*/
function aggregateResponses(responses) {
	const lastResponse = responses[responses.length - 1];
	const aggregatedResponse = { promptFeedback: lastResponse === null || lastResponse === void 0 ? void 0 : lastResponse.promptFeedback };
	for (const response of responses) {
		if (response.candidates) {
			let candidateIndex = 0;
			for (const candidate of response.candidates) {
				if (!aggregatedResponse.candidates) aggregatedResponse.candidates = [];
				if (!aggregatedResponse.candidates[candidateIndex]) aggregatedResponse.candidates[candidateIndex] = { index: candidateIndex };
				aggregatedResponse.candidates[candidateIndex].citationMetadata = candidate.citationMetadata;
				aggregatedResponse.candidates[candidateIndex].groundingMetadata = candidate.groundingMetadata;
				aggregatedResponse.candidates[candidateIndex].finishReason = candidate.finishReason;
				aggregatedResponse.candidates[candidateIndex].finishMessage = candidate.finishMessage;
				aggregatedResponse.candidates[candidateIndex].safetyRatings = candidate.safetyRatings;
				/**
				* Candidates should always have content and parts, but this handles
				* possible malformed responses.
				*/
				if (candidate.content && candidate.content.parts) {
					if (!aggregatedResponse.candidates[candidateIndex].content) aggregatedResponse.candidates[candidateIndex].content = {
						role: candidate.content.role || "user",
						parts: []
					};
					const newPart = {};
					for (const part of candidate.content.parts) {
						if (part.text) newPart.text = part.text;
						if (part.functionCall) newPart.functionCall = part.functionCall;
						if (part.executableCode) newPart.executableCode = part.executableCode;
						if (part.codeExecutionResult) newPart.codeExecutionResult = part.codeExecutionResult;
						if (Object.keys(newPart).length === 0) newPart.text = "";
						aggregatedResponse.candidates[candidateIndex].content.parts.push(newPart);
					}
				}
			}
			candidateIndex++;
		}
		if (response.usageMetadata) aggregatedResponse.usageMetadata = response.usageMetadata;
	}
	return aggregatedResponse;
}
/**
* @license
* Copyright 2024 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
async function generateContentStream(apiKey, model, params, requestOptions) {
	return processStream(await makeModelRequest(model, Task.STREAM_GENERATE_CONTENT, apiKey, true, JSON.stringify(params), requestOptions));
}
async function generateContent(apiKey, model, params, requestOptions) {
	return { response: addHelpers(await (await makeModelRequest(model, Task.GENERATE_CONTENT, apiKey, false, JSON.stringify(params), requestOptions)).json()) };
}
/**
* @license
* Copyright 2024 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
function formatSystemInstruction(input) {
	if (input == null) return;
	else if (typeof input === "string") return {
		role: "system",
		parts: [{ text: input }]
	};
	else if (input.text) return {
		role: "system",
		parts: [input]
	};
	else if (input.parts) if (!input.role) return {
		role: "system",
		parts: input.parts
	};
	else return input;
}
function formatNewContent(request) {
	let newParts = [];
	if (typeof request === "string") newParts = [{ text: request }];
	else for (const partOrString of request) if (typeof partOrString === "string") newParts.push({ text: partOrString });
	else newParts.push(partOrString);
	return assignRoleToPartsAndValidateSendMessageRequest(newParts);
}
/**
* When multiple Part types (i.e. FunctionResponsePart and TextPart) are
* passed in a single Part array, we may need to assign different roles to each
* part. Currently only FunctionResponsePart requires a role other than 'user'.
* @private
* @param parts Array of parts to pass to the model
* @returns Array of content items
*/
function assignRoleToPartsAndValidateSendMessageRequest(parts) {
	const userContent = {
		role: "user",
		parts: []
	};
	const functionContent = {
		role: "function",
		parts: []
	};
	let hasUserContent = false;
	let hasFunctionContent = false;
	for (const part of parts) if ("functionResponse" in part) {
		functionContent.parts.push(part);
		hasFunctionContent = true;
	} else {
		userContent.parts.push(part);
		hasUserContent = true;
	}
	if (hasUserContent && hasFunctionContent) throw new GoogleGenerativeAIError("Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.");
	if (!hasUserContent && !hasFunctionContent) throw new GoogleGenerativeAIError("No content is provided for sending chat message.");
	if (hasUserContent) return userContent;
	return functionContent;
}
function formatCountTokensInput(params, modelParams) {
	var _a;
	let formattedGenerateContentRequest = {
		model: modelParams === null || modelParams === void 0 ? void 0 : modelParams.model,
		generationConfig: modelParams === null || modelParams === void 0 ? void 0 : modelParams.generationConfig,
		safetySettings: modelParams === null || modelParams === void 0 ? void 0 : modelParams.safetySettings,
		tools: modelParams === null || modelParams === void 0 ? void 0 : modelParams.tools,
		toolConfig: modelParams === null || modelParams === void 0 ? void 0 : modelParams.toolConfig,
		systemInstruction: modelParams === null || modelParams === void 0 ? void 0 : modelParams.systemInstruction,
		cachedContent: (_a = modelParams === null || modelParams === void 0 ? void 0 : modelParams.cachedContent) === null || _a === void 0 ? void 0 : _a.name,
		contents: []
	};
	const containsGenerateContentRequest = params.generateContentRequest != null;
	if (params.contents) {
		if (containsGenerateContentRequest) throw new GoogleGenerativeAIRequestInputError("CountTokensRequest must have one of contents or generateContentRequest, not both.");
		formattedGenerateContentRequest.contents = params.contents;
	} else if (containsGenerateContentRequest) formattedGenerateContentRequest = Object.assign(Object.assign({}, formattedGenerateContentRequest), params.generateContentRequest);
	else {
		const content = formatNewContent(params);
		formattedGenerateContentRequest.contents = [content];
	}
	return { generateContentRequest: formattedGenerateContentRequest };
}
function formatGenerateContentInput(params) {
	let formattedRequest;
	if (params.contents) formattedRequest = params;
	else formattedRequest = { contents: [formatNewContent(params)] };
	if (params.systemInstruction) formattedRequest.systemInstruction = formatSystemInstruction(params.systemInstruction);
	return formattedRequest;
}
function formatEmbedContentInput(params) {
	if (typeof params === "string" || Array.isArray(params)) return { content: formatNewContent(params) };
	return params;
}
/**
* @license
* Copyright 2024 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
var VALID_PART_FIELDS = [
	"text",
	"inlineData",
	"functionCall",
	"functionResponse",
	"executableCode",
	"codeExecutionResult"
];
var VALID_PARTS_PER_ROLE = {
	user: ["text", "inlineData"],
	function: ["functionResponse"],
	model: [
		"text",
		"functionCall",
		"executableCode",
		"codeExecutionResult"
	],
	system: ["text"]
};
function validateChatHistory(history) {
	let prevContent = false;
	for (const currContent of history) {
		const { role, parts } = currContent;
		if (!prevContent && role !== "user") throw new GoogleGenerativeAIError(`First content should be with role 'user', got ${role}`);
		if (!POSSIBLE_ROLES.includes(role)) throw new GoogleGenerativeAIError(`Each item should include role field. Got ${role} but valid roles are: ${JSON.stringify(POSSIBLE_ROLES)}`);
		if (!Array.isArray(parts)) throw new GoogleGenerativeAIError("Content should have 'parts' property with an array of Parts");
		if (parts.length === 0) throw new GoogleGenerativeAIError("Each Content should have at least one part");
		const countFields = {
			text: 0,
			inlineData: 0,
			functionCall: 0,
			functionResponse: 0,
			fileData: 0,
			executableCode: 0,
			codeExecutionResult: 0
		};
		for (const part of parts) for (const key of VALID_PART_FIELDS) if (key in part) countFields[key] += 1;
		const validParts = VALID_PARTS_PER_ROLE[role];
		for (const key of VALID_PART_FIELDS) if (!validParts.includes(key) && countFields[key] > 0) throw new GoogleGenerativeAIError(`Content with role '${role}' can't contain '${key}' part`);
		prevContent = true;
	}
}
/**
* Returns true if the response is valid (could be appended to the history), flase otherwise.
*/
function isValidResponse(response) {
	var _a;
	if (response.candidates === void 0 || response.candidates.length === 0) return false;
	const content = (_a = response.candidates[0]) === null || _a === void 0 ? void 0 : _a.content;
	if (content === void 0) return false;
	if (content.parts === void 0 || content.parts.length === 0) return false;
	for (const part of content.parts) {
		if (part === void 0 || Object.keys(part).length === 0) return false;
		if (part.text !== void 0 && part.text === "") return false;
	}
	return true;
}
/**
* @license
* Copyright 2024 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* Do not log a message for this error.
*/
var SILENT_ERROR = "SILENT_ERROR";
/**
* ChatSession class that enables sending chat messages and stores
* history of sent and received messages so far.
*
* @public
*/
var ChatSession = class {
	constructor(apiKey, model, params, _requestOptions = {}) {
		this.model = model;
		this.params = params;
		this._requestOptions = _requestOptions;
		this._history = [];
		this._sendPromise = Promise.resolve();
		this._apiKey = apiKey;
		if (params === null || params === void 0 ? void 0 : params.history) {
			validateChatHistory(params.history);
			this._history = params.history;
		}
	}
	/**
	* Gets the chat history so far. Blocked prompts are not added to history.
	* Blocked candidates are not added to history, nor are the prompts that
	* generated them.
	*/
	async getHistory() {
		await this._sendPromise;
		return this._history;
	}
	/**
	* Sends a chat message and receives a non-streaming
	* {@link GenerateContentResult}.
	*
	* Fields set in the optional {@link SingleRequestOptions} parameter will
	* take precedence over the {@link RequestOptions} values provided to
	* {@link GoogleGenerativeAI.getGenerativeModel }.
	*/
	async sendMessage(request, requestOptions = {}) {
		var _a, _b, _c, _d, _e, _f;
		await this._sendPromise;
		const newContent = formatNewContent(request);
		const generateContentRequest = {
			safetySettings: (_a = this.params) === null || _a === void 0 ? void 0 : _a.safetySettings,
			generationConfig: (_b = this.params) === null || _b === void 0 ? void 0 : _b.generationConfig,
			tools: (_c = this.params) === null || _c === void 0 ? void 0 : _c.tools,
			toolConfig: (_d = this.params) === null || _d === void 0 ? void 0 : _d.toolConfig,
			systemInstruction: (_e = this.params) === null || _e === void 0 ? void 0 : _e.systemInstruction,
			cachedContent: (_f = this.params) === null || _f === void 0 ? void 0 : _f.cachedContent,
			contents: [...this._history, newContent]
		};
		const chatSessionRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
		let finalResult;
		this._sendPromise = this._sendPromise.then(() => generateContent(this._apiKey, this.model, generateContentRequest, chatSessionRequestOptions)).then((result) => {
			var _a;
			if (isValidResponse(result.response)) {
				this._history.push(newContent);
				const responseContent = Object.assign({
					parts: [],
					role: "model"
				}, (_a = result.response.candidates) === null || _a === void 0 ? void 0 : _a[0].content);
				this._history.push(responseContent);
			} else {
				const blockErrorMessage = formatBlockErrorMessage(result.response);
				if (blockErrorMessage) console.warn(`sendMessage() was unsuccessful. ${blockErrorMessage}. Inspect response object for details.`);
			}
			finalResult = result;
		}).catch((e) => {
			this._sendPromise = Promise.resolve();
			throw e;
		});
		await this._sendPromise;
		return finalResult;
	}
	/**
	* Sends a chat message and receives the response as a
	* {@link GenerateContentStreamResult} containing an iterable stream
	* and a response promise.
	*
	* Fields set in the optional {@link SingleRequestOptions} parameter will
	* take precedence over the {@link RequestOptions} values provided to
	* {@link GoogleGenerativeAI.getGenerativeModel }.
	*/
	async sendMessageStream(request, requestOptions = {}) {
		var _a, _b, _c, _d, _e, _f;
		await this._sendPromise;
		const newContent = formatNewContent(request);
		const generateContentRequest = {
			safetySettings: (_a = this.params) === null || _a === void 0 ? void 0 : _a.safetySettings,
			generationConfig: (_b = this.params) === null || _b === void 0 ? void 0 : _b.generationConfig,
			tools: (_c = this.params) === null || _c === void 0 ? void 0 : _c.tools,
			toolConfig: (_d = this.params) === null || _d === void 0 ? void 0 : _d.toolConfig,
			systemInstruction: (_e = this.params) === null || _e === void 0 ? void 0 : _e.systemInstruction,
			cachedContent: (_f = this.params) === null || _f === void 0 ? void 0 : _f.cachedContent,
			contents: [...this._history, newContent]
		};
		const chatSessionRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
		const streamPromise = generateContentStream(this._apiKey, this.model, generateContentRequest, chatSessionRequestOptions);
		this._sendPromise = this._sendPromise.then(() => streamPromise).catch((_ignored) => {
			throw new Error(SILENT_ERROR);
		}).then((streamResult) => streamResult.response).then((response) => {
			if (isValidResponse(response)) {
				this._history.push(newContent);
				const responseContent = Object.assign({}, response.candidates[0].content);
				if (!responseContent.role) responseContent.role = "model";
				this._history.push(responseContent);
			} else {
				const blockErrorMessage = formatBlockErrorMessage(response);
				if (blockErrorMessage) console.warn(`sendMessageStream() was unsuccessful. ${blockErrorMessage}. Inspect response object for details.`);
			}
		}).catch((e) => {
			if (e.message !== SILENT_ERROR) console.error(e);
		});
		return streamPromise;
	}
};
/**
* @license
* Copyright 2024 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
async function countTokens(apiKey, model, params, singleRequestOptions) {
	return (await makeModelRequest(model, Task.COUNT_TOKENS, apiKey, false, JSON.stringify(params), singleRequestOptions)).json();
}
/**
* @license
* Copyright 2024 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
async function embedContent(apiKey, model, params, requestOptions) {
	return (await makeModelRequest(model, Task.EMBED_CONTENT, apiKey, false, JSON.stringify(params), requestOptions)).json();
}
async function batchEmbedContents(apiKey, model, params, requestOptions) {
	const requestsWithModel = params.requests.map((request) => {
		return Object.assign(Object.assign({}, request), { model });
	});
	return (await makeModelRequest(model, Task.BATCH_EMBED_CONTENTS, apiKey, false, JSON.stringify({ requests: requestsWithModel }), requestOptions)).json();
}
/**
* @license
* Copyright 2024 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* Class for generative model APIs.
* @public
*/
var GenerativeModel = class {
	constructor(apiKey, modelParams, _requestOptions = {}) {
		this.apiKey = apiKey;
		this._requestOptions = _requestOptions;
		if (modelParams.model.includes("/")) this.model = modelParams.model;
		else this.model = `models/${modelParams.model}`;
		this.generationConfig = modelParams.generationConfig || {};
		this.safetySettings = modelParams.safetySettings || [];
		this.tools = modelParams.tools;
		this.toolConfig = modelParams.toolConfig;
		this.systemInstruction = formatSystemInstruction(modelParams.systemInstruction);
		this.cachedContent = modelParams.cachedContent;
	}
	/**
	* Makes a single non-streaming call to the model
	* and returns an object containing a single {@link GenerateContentResponse}.
	*
	* Fields set in the optional {@link SingleRequestOptions} parameter will
	* take precedence over the {@link RequestOptions} values provided to
	* {@link GoogleGenerativeAI.getGenerativeModel }.
	*/
	async generateContent(request, requestOptions = {}) {
		var _a;
		const formattedParams = formatGenerateContentInput(request);
		const generativeModelRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
		return generateContent(this.apiKey, this.model, Object.assign({
			generationConfig: this.generationConfig,
			safetySettings: this.safetySettings,
			tools: this.tools,
			toolConfig: this.toolConfig,
			systemInstruction: this.systemInstruction,
			cachedContent: (_a = this.cachedContent) === null || _a === void 0 ? void 0 : _a.name
		}, formattedParams), generativeModelRequestOptions);
	}
	/**
	* Makes a single streaming call to the model and returns an object
	* containing an iterable stream that iterates over all chunks in the
	* streaming response as well as a promise that returns the final
	* aggregated response.
	*
	* Fields set in the optional {@link SingleRequestOptions} parameter will
	* take precedence over the {@link RequestOptions} values provided to
	* {@link GoogleGenerativeAI.getGenerativeModel }.
	*/
	async generateContentStream(request, requestOptions = {}) {
		var _a;
		const formattedParams = formatGenerateContentInput(request);
		const generativeModelRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
		return generateContentStream(this.apiKey, this.model, Object.assign({
			generationConfig: this.generationConfig,
			safetySettings: this.safetySettings,
			tools: this.tools,
			toolConfig: this.toolConfig,
			systemInstruction: this.systemInstruction,
			cachedContent: (_a = this.cachedContent) === null || _a === void 0 ? void 0 : _a.name
		}, formattedParams), generativeModelRequestOptions);
	}
	/**
	* Gets a new {@link ChatSession} instance which can be used for
	* multi-turn chats.
	*/
	startChat(startChatParams) {
		var _a;
		return new ChatSession(this.apiKey, this.model, Object.assign({
			generationConfig: this.generationConfig,
			safetySettings: this.safetySettings,
			tools: this.tools,
			toolConfig: this.toolConfig,
			systemInstruction: this.systemInstruction,
			cachedContent: (_a = this.cachedContent) === null || _a === void 0 ? void 0 : _a.name
		}, startChatParams), this._requestOptions);
	}
	/**
	* Counts the tokens in the provided request.
	*
	* Fields set in the optional {@link SingleRequestOptions} parameter will
	* take precedence over the {@link RequestOptions} values provided to
	* {@link GoogleGenerativeAI.getGenerativeModel }.
	*/
	async countTokens(request, requestOptions = {}) {
		const formattedParams = formatCountTokensInput(request, {
			model: this.model,
			generationConfig: this.generationConfig,
			safetySettings: this.safetySettings,
			tools: this.tools,
			toolConfig: this.toolConfig,
			systemInstruction: this.systemInstruction,
			cachedContent: this.cachedContent
		});
		const generativeModelRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
		return countTokens(this.apiKey, this.model, formattedParams, generativeModelRequestOptions);
	}
	/**
	* Embeds the provided content.
	*
	* Fields set in the optional {@link SingleRequestOptions} parameter will
	* take precedence over the {@link RequestOptions} values provided to
	* {@link GoogleGenerativeAI.getGenerativeModel }.
	*/
	async embedContent(request, requestOptions = {}) {
		const formattedParams = formatEmbedContentInput(request);
		const generativeModelRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
		return embedContent(this.apiKey, this.model, formattedParams, generativeModelRequestOptions);
	}
	/**
	* Embeds an array of {@link EmbedContentRequest}s.
	*
	* Fields set in the optional {@link SingleRequestOptions} parameter will
	* take precedence over the {@link RequestOptions} values provided to
	* {@link GoogleGenerativeAI.getGenerativeModel }.
	*/
	async batchEmbedContents(batchEmbedContentRequest, requestOptions = {}) {
		const generativeModelRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
		return batchEmbedContents(this.apiKey, this.model, batchEmbedContentRequest, generativeModelRequestOptions);
	}
};
/**
* @license
* Copyright 2024 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
/**
* Top-level class for this SDK
* @public
*/
var GoogleGenerativeAI = class {
	constructor(apiKey) {
		this.apiKey = apiKey;
	}
	/**
	* Gets a {@link GenerativeModel} instance for the provided model name.
	*/
	getGenerativeModel(modelParams, requestOptions) {
		if (!modelParams.model) throw new GoogleGenerativeAIError("Must provide a model name. Example: genai.getGenerativeModel({ model: 'my-model-name' })");
		return new GenerativeModel(this.apiKey, modelParams, requestOptions);
	}
	/**
	* Creates a {@link GenerativeModel} instance from provided content cache.
	*/
	getGenerativeModelFromCachedContent(cachedContent, modelParams, requestOptions) {
		if (!cachedContent.name) throw new GoogleGenerativeAIRequestInputError("Cached content must contain a `name` field.");
		if (!cachedContent.model) throw new GoogleGenerativeAIRequestInputError("Cached content must contain a `model` field.");
		for (const key of ["model", "systemInstruction"]) if ((modelParams === null || modelParams === void 0 ? void 0 : modelParams[key]) && cachedContent[key] && (modelParams === null || modelParams === void 0 ? void 0 : modelParams[key]) !== cachedContent[key]) {
			if (key === "model") {
				if ((modelParams.model.startsWith("models/") ? modelParams.model.replace("models/", "") : modelParams.model) === (cachedContent.model.startsWith("models/") ? cachedContent.model.replace("models/", "") : cachedContent.model)) continue;
			}
			throw new GoogleGenerativeAIRequestInputError(`Different value for "${key}" specified in modelParams (${modelParams[key]}) and cachedContent (${cachedContent[key]})`);
		}
		const modelParamsFromCache = Object.assign(Object.assign({}, modelParams), {
			model: cachedContent.model,
			tools: cachedContent.tools,
			toolConfig: cachedContent.toolConfig,
			systemInstruction: cachedContent.systemInstruction,
			cachedContent
		});
		return new GenerativeModel(this.apiKey, modelParamsFromCache, requestOptions);
	}
};
//#endregion
export { BlockReason, ChatSession, DynamicRetrievalMode, ExecutableCodeLanguage, FinishReason, FunctionCallingMode, GenerativeModel, GoogleGenerativeAI, GoogleGenerativeAIAbortError, GoogleGenerativeAIError, GoogleGenerativeAIFetchError, GoogleGenerativeAIRequestInputError, GoogleGenerativeAIResponseError, HarmBlockThreshold, HarmCategory, HarmProbability, Outcome, POSSIBLE_ROLES, SchemaType, TaskType };

//# sourceMappingURL=@google_generative-ai.js.map