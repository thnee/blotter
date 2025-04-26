export class Address {
	value: number = $state(0);

	constructor(value: number) {
		this.value = value;
	}

	setFromDotSeparatedDecimalString(value: string) {
		let addressParts = value.split(".");
		let octets = [
			parseInt(addressParts[0]),
			parseInt(addressParts[1]),
			parseInt(addressParts[2]),
			parseInt(addressParts[3]),
		];
		this.value = (
			(octets[0] << 24) +
			(octets[1] << 16) +
			(octets[2] << 8) +
			(octets[3] << 0)
		);
	}

	toOctets(): Array<number> {
		return [
			(this.value >> 24) & 255,
			(this.value >> 16) & 255,
			(this.value >> 8) & 255,
			(this.value >> 0) & 255,
		];
	}
}

export class Netmask {
	bitsTotal: number = $state(0);
	bitsReserved: number = $state(0);
	bitsUsable: number = $state(0);
	bitsHost: number = $state(0);

	cidrToNumber(value: number): number {
		var result = 0;
		for (var i = 0; i < 32; i++) {
			if (i >= (32 - value)) {
				result |= (1 << i);
			}
		}
		return result;
	}

	toAddress() {
		return new Address(this.cidrToNumber(this.bitsTotal));
	}
}

export default class Network {
	address: Address = $state(new Address(0));
	netmask: Netmask = $state(new Netmask());

	numberOfNetworksTotal: number = $state(0);
	numberOfNetworksReserved: number = $state(0);
	numberOfNetworksUsable: number = $state(0);

	numberofHostsPerNetworkTotal: number = $state(0);
	numberOfHostsPerNetworkUsable: number = $state(0);

	update(address: number | string, bitsTotal: number, bitsReserved: number) {
		if (bitsTotal < bitsReserved) {
			bitsTotal = bitsReserved;
		}
		if (bitsReserved > bitsTotal) {
			bitsReserved = bitsTotal;
		}

		if (typeof(address) == "string") {
			this.address.setFromDotSeparatedDecimalString(address);
		}
		if (typeof(address) == "number") {
			this.address.value = address;
		}
		this.netmask.bitsTotal = bitsTotal;
		this.netmask.bitsReserved = bitsReserved;
		this.netmask.bitsUsable = bitsTotal - bitsReserved;
		this.netmask.bitsHost = 32 - bitsTotal;

		this.numberOfNetworksTotal = (
			this.binaryOnesToDecimal(this.netmask.bitsTotal) + 1
		);
		this.numberOfNetworksReserved = (
			this.binaryOnesToDecimal(this.netmask.bitsReserved) + 1
		);
		this.numberOfNetworksUsable = (
			this.binaryOnesToDecimal(this.netmask.bitsTotal - this.netmask.bitsReserved) + 1
		);
		this.numberofHostsPerNetworkTotal = (
			this.binaryOnesToDecimal(32 - this.netmask.bitsTotal) + 1
		);
		this.numberOfHostsPerNetworkUsable = (
			Math.max(this.numberofHostsPerNetworkTotal - 2, 0)
		);
	}

	binaryOnesToDecimal(size: number): number {
		var result = 0;
		for (var i = 0; i < size; i++) {
			result |= (1 << i);
		}
		return (result >>> 0);
	}

	getSubnets(numberOfNetworksToShow: number): SubnetResult {
		let networks: SubnetResult = {
			start: [],
			end: [],
			total: this.numberOfNetworksUsable,
			excluded: 0,
		};

		let numberOfNetworksToShowAtStart = 0;
		let numberOfNetworksToShowAtEnd = 0;

		if (this.numberOfNetworksUsable <= numberOfNetworksToShow) {
			numberOfNetworksToShowAtStart = Math.min(
				numberOfNetworksToShow,
				this.numberOfNetworksUsable,
			);
		} else {
			numberOfNetworksToShowAtStart = Math.min(
				numberOfNetworksToShow / 2,
				this.numberOfNetworksUsable / 2,
			);
			numberOfNetworksToShowAtEnd = Math.min(
				numberOfNetworksToShow / 2,
				this.numberOfNetworksUsable / 2,
			);
			networks.excluded = this.numberOfNetworksUsable - numberOfNetworksToShow;
		}

		let createNetwork = (index: number): Network => {
			let addressMask = index << (32 - this.netmask.bitsTotal);
			let _address = this.address.value | addressMask;

			let network = new Network();
			network.update(
				_address,
				this.netmask.bitsTotal,
				this.netmask.bitsReserved,
			);
			return network;
		};

		for (var i = 0; i < numberOfNetworksToShowAtStart; i++) {
			networks.start.push(createNetwork(i));
		}

		for (var i = 0; i < numberOfNetworksToShowAtEnd; i++) {
			networks.end.push(createNetwork(this.numberOfNetworksUsable - 1 - i));
		}

		return networks;
	}
}

type SubnetResult = {
	start: Network[];
	end: Network[];
	total: number;
	excluded: number;
}
