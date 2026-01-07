class FilterDropoff {
  private conflict_Pairs: string[][][];
  private pickup_to_dropoffs: { [key: string]: string[] };
  constructor() {
    this.conflict_Pairs = [
      [
        ['D07S', 'D08S', 'D09S', 'D10S'],
        ['D05S', 'D06S', 'D11S', 'D12S'],
      ],
      [
        ['D13S', 'D14S', 'D20S'],
        ['D18S', 'D19S'],
      ],
      [['D21S'], ['D22S']],
    ];
    this.pickup_to_dropoffs = {
      P01S: [
        'D01S',
        'D02S',
        'D03S',
        'D04S',
        'D05S',
        'D06S',
        'D07S',
        'D08S',
        'D09S',
        'D10S',
        'D11S',
        'D12S',
        'D13S',
        'D14S',
        'D15S',
        'D17S',
        'D18S',
        'D19S',
      ],
      P02S: [
        'D01S',
        'D02S',
        'D03S',
        'D04S',
        'D05S',
        'D06S',
        'D07S',
        'D08S',
        'D09S',
        'D10S',
        'D11S',
        'D12S',
        'D13S',
        'D14S',
        'D15S',
        'D17S',
        'D18S',
        'D19S',
      ],
      P03S: [
        'D01S',
        'D02S',
        'D03S',
        'D04S',
        'D05S',
        'D06S',
        'D07S',
        'D08S',
        'D09S',
        'D10S',
        'D11S',
        'D12S',
        'D13S',
        'D14S',
        'D15S',
        'D17S',
        'D18S',
        'D19S',
      ],
      P04S: ['D15S', 'D20S', 'D21S', 'D22S'],
      P05S: [
        'D01S',
        'D02S',
        'D03S',
        'D04S',
        'D05S',
        'D06S',
        'D07S',
        'D08S',
        'D09S',
        'D10S',
        'D11S',
        'D12S',
        'D13S',
        'D14S',
        'D15S',
        'D17S',
        'D18S',
        'D19S',
      ],
      P06S: ['D16S', 'D20S', 'D22S'],
      P07S: ['D21S'],
      P08S: ['D21S'],
    };
  }
  public validate_stations(stations: string[]): {
    pickup: string | null;
    selected_dropoffs: string[];
    blocked_dropoffs: string[];
    available_dropoffs: string[];
  } {
    var pickup: string | null = null; // Example pickup station
    const selected_dropoffs: string[] = [];
    var blocked_dropoffs: string[] = [];
    var available_dropoffs: string[] = [];
    if (stations.length > 0) {
      for (const s of stations) {
        if (s.startsWith('P')) {
          pickup = s;
          available_dropoffs = this.pickup_to_dropoffs[s] || [];
        } else if (s.startsWith('D')) {
          selected_dropoffs.push(s);
          for (const [group_a, group_b] of this.conflict_Pairs) {
            if (group_a.includes(s)) {
              blocked_dropoffs = blocked_dropoffs.concat(group_b);
            } else if (group_b.includes(s)) {
              blocked_dropoffs = blocked_dropoffs.concat(group_a);
            }
          }
        }
      }

    }
    return {
      pickup,
      selected_dropoffs,
      blocked_dropoffs,
      available_dropoffs,
    };
  }
}
// const runTor = new FilterDropoff();
// const data = runTor.validate_stations(['P04S','D07S',"D19S","D21S"]);
// console.log(data);
export default FilterDropoff;